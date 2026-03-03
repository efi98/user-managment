import {SessionAgent} from "@tests/utils/session-agent";

type Agent = SessionAgent;

export async function seedUser(
    agent: Agent,
    user: { username: string; password: string; birthdate?: string; gender?: string; displayName?: string },
): Promise<void> {
    await agent
        .post('/users')
        .send({
            username: user.username,
            password: user.password,
            birthdate: user.birthdate,
            gender: user.gender,
            displayName: user.displayName,
        })
        .expect(201);
}

export async function loginUser(agent: Agent, creds: { username: string; password: string }): Promise<void> {
    await agent.post('/login').send(creds).expect(200);
}

export async function logoutUser(agent: Agent): Promise<void> {
    await agent.post('/logout').expect(204);
}