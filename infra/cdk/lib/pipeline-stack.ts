import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as cpactions from 'aws-cdk-lib/aws-codepipeline-actions';

export interface PipelineStackProps extends cdk.StackProps {
    connectionArn: string;

    repoOwner: string;
    repoName: string;
    branchName: string;

    // Your existing resources
    ecrRepoUri: string;           // 874851036047.dkr.ecr.us-east-1.amazonaws.com/valkey-backend
    ecsClusterName: string;       // user-managment-app
    ecsServiceName: string;       // user-managment-app  (confirm actual service name in ECS)
    s3BucketName: string;         // user-management-fronfend
    cloudFrontDistributionId?: string; // E1DPJ9CKSIXIA (optional)
    regionName: string;           // us-east-1
}

export class PipelineStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: PipelineStackProps) {
        super(scope, id, props);

        const connectionArnParam = new cdk.CfnParameter(this, 'ConnectionArn', {
            type: 'String',
        });
        const repoOwnerParam = new cdk.CfnParameter(this, 'RepoOwner', {
            type: 'String',
        });
        const repoNameParam = new cdk.CfnParameter(this, 'RepoName', {
            type: 'String',
        });
        const branchNameParam = new cdk.CfnParameter(this, 'BranchName', {
            type: 'String',
            default: 'main',
        });
        const EcrRepoUri = new cdk.CfnParameter(this, 'EcrRepoUri', {type: 'String'});
        const EcsClusterName = new cdk.CfnParameter(this, 'EcsClusterName', {type: 'String'});
        const EcsServiceName = new cdk.CfnParameter(this, 'EcsServiceName', {type: 'String'});
        const FrontendBucketName = new cdk.CfnParameter(this, 'FrontendBucketName', {type: 'String'});
        const CloudFrontDistributionId = new cdk.CfnParameter(this, 'CloudFrontDistributionId', {
            type: 'String',
            default: '',
        });
        const AwsRegion = new cdk.CfnParameter(this, 'AwsRegion', {type: 'String', default: 'us-east-1'});

        const sourceOutput = new codepipeline.Artifact('Source');

        const pipeline = new codepipeline.Pipeline(this, 'UserManagementPipeline', {
            pipelineName: 'user-management-monorepo-pipeline',
            restartExecutionOnUpdate: true,
        });

        // Source (GitHub via CodeConnections)
        pipeline.addStage({
            stageName: 'Source',
            actions: [
                new cpactions.CodeStarConnectionsSourceAction({
                    actionName: 'GitHub_Source',
                    connectionArn: connectionArnParam.valueAsString,
                    owner: repoOwnerParam.valueAsString,
                    repo: repoNameParam.valueAsString,
                    branch: branchNameParam.valueAsString,
                    output: sourceOutput,
                }),
            ],
        });

        // Reference your existing S3 bucket (do not create a new one)
        const frontendBucket = s3.Bucket.fromBucketName(this, 'FrontendBucket', FrontendBucketName.valueAsString);

        // CodeBuild project: Backend
        const backendBuild = new codebuild.PipelineProject(this, 'BackendBuild', {
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
                privileged: true, // needed for docker build
            },
            environmentVariables: {
                AWS_REGION: {value: AwsRegion.valueAsString},
                ECR_REPO_URI: {value: EcrRepoUri.valueAsString},
                ECS_CLUSTER: {value: EcsClusterName.valueAsString},
                ECS_SERVICE: {value: EcsServiceName.valueAsString},
            },
            buildSpec: codebuild.BuildSpec.fromObject({
                version: '0.2',
                phases: {
                    pre_build: {
                        commands: [
                            'set -euo pipefail',
                            'echo Logging in to Amazon ECR...',
                            'aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(echo $ECR_REPO_URI | cut -d/ -f1)',
                            'COMMIT_SHA=${CODEBUILD_RESOLVED_SOURCE_VERSION}',
                            'IMAGE_URI=$ECR_REPO_URI:$COMMIT_SHA',
                            'echo IMAGE_URI=$IMAGE_URI',
                        ],
                    },
                    build: {
                        commands: [
                            'echo Build backend docker image...',
                            'docker build -t $IMAGE_URI backend',
                            'docker push $IMAGE_URI',
                        ],
                    },
                    post_build: {
                        commands: [
                            'echo Trigger ECS new deployment...',
                            'aws ecs update-service --cluster $ECS_CLUSTER --service $ECS_SERVICE --force-new-deployment --region $AWS_REGION',
                        ],
                    },
                },
            }),
        });

        // Permissions for backend build
        backendBuild.addToRolePolicy(new iam.PolicyStatement({
            actions: [
                'ecr:GetAuthorizationToken',
                'ecr:BatchCheckLayerAvailability',
                'ecr:CompleteLayerUpload',
                'ecr:UploadLayerPart',
                'ecr:InitiateLayerUpload',
                'ecr:PutImage',
                'ecr:BatchGetImage',
            ],
            resources: ['*'],
        }));

        backendBuild.addToRolePolicy(new iam.PolicyStatement({
            actions: [
                'ecs:UpdateService',
                'ecs:DescribeServices',
                'ecs:DescribeTaskDefinition',
                'ecs:ListTasks',
                'ecs:DescribeTasks',
            ],
            resources: ['*'],
        }));

        pipeline.addStage({
            stageName: 'Backend',
            actions: [
                new cpactions.CodeBuildAction({
                    actionName: 'Build_Push_Deploy_Backend',
                    project: backendBuild,
                    input: sourceOutput,
                }),
            ],
        });

        // CodeBuild project: Frontend
        const frontendBuild = new codebuild.PipelineProject(this, 'FrontendBuild', {
            environment: {
                buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
            },
            environmentVariables: {
                AWS_REGION: {value: AwsRegion.valueAsString},
                FRONTEND_BUCKET: {value: FrontendBucketName.valueAsString},
                CF_DIST_ID: {value: CloudFrontDistributionId.valueAsString},
            },
            buildSpec: codebuild.BuildSpec.fromObject({
                version: '0.2',
                phases: {
                    install: {
                        commands: [
                            'set -euo pipefail',
                            'cd frontend',
                            'npm ci',
                        ],
                    },
                    build: {
                        commands: [
                            'npm run build',
                        ],
                    },
                    post_build: {
                        commands: [
                            // Adjust dist path if your Angular output differs
                            'echo Sync to S3...',
                            'aws s3 sync dist/ s3://$FRONTEND_BUCKET/ --delete',
                            'if [ -n "$CF_DIST_ID" ]; then aws cloudfront create-invalidation --distribution-id "$CF_DIST_ID" --paths "/*"; fi',
                        ],
                    },
                },
            }),
        });

        // Permissions for frontend build
        frontendBucket.grantReadWrite(frontendBuild);

        frontendBuild.addToRolePolicy(new iam.PolicyStatement({
            actions: [
                'cloudfront:CreateInvalidation',
            ],
            resources: ['*'],
        }));

        pipeline.addStage({
            stageName: 'Frontend',
            actions: [
                new cpactions.CodeBuildAction({
                    actionName: 'Build_And_Upload_Frontend',
                    project: frontendBuild,
                    input: sourceOutput,
                }),
            ],
        });
    }
}
