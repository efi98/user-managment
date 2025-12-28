#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { PipelineStack } from "../lib/pipeline-stack";

const app = new cdk.App();

const connectionArn = app.node.tryGetContext('connectionArn') ?? 'arn:aws:codeconnections:us-east-1:874851036047:connection/220eff36-4ed2-4af1-bc11-537b084891b8';
const repoOwner = app.node.tryGetContext('repoOwner') ?? 'efi98';
const repoName = app.node.tryGetContext('repoName') ?? 'user-managment';
const branchName = app.node.tryGetContext('branchName') ?? 'main';

const ecrRepoUri = app.node.tryGetContext('ecrRepoUri');
const ecsClusterName = app.node.tryGetContext('ecsClusterName') ?? 'user-managment-app';
const ecsServiceName = app.node.tryGetContext('ecsServiceName') ?? 'user-managment-app';
const s3BucketName = app.node.tryGetContext('s3BucketName') ?? 'user-management-fronfend';
const cloudFrontDistributionId = app.node.tryGetContext('cloudFrontDistributionId') ?? '';
const regionName = app.node.tryGetContext('regionName') ?? 'us-east-1';

new PipelineStack(app, 'UserManagementPipelineStack', {
    env: {region: regionName},
    connectionArn,
    repoOwner,
    repoName,
    branchName,
    ecrRepoUri,
    ecsClusterName,
    ecsServiceName,
    s3BucketName,
    cloudFrontDistributionId,
    regionName,
});
