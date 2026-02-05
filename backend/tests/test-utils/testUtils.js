const request = require("supertest");
const { createApp } = require("../../app");
const { AppDataSource } = require("../../helpers/db");

async function initTestApp() {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }
    const app = createApp();
    return { app };
}

async function resetDb() {
    await AppDataSource.synchronize(true);
}

async function closeDb() {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
    }
}

async function login(agent, username, password) {
    return agent.post("/login").send({ username, password });
}

async function createUser(agentOrReq, user) {
    return agentOrReq.post("/users").send(user);
}

module.exports = { request, initTestApp, resetDb, closeDb, login, createUser };
