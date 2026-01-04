const request = require("supertest");
const { createApp } = require("../../app");
const { AppDataSource } = require("../../helpers/db");

async function initTestApp() {
    await AppDataSource.initialize();
    const app = createApp();
    return { app };
}

async function resetDb() {
    await AppDataSource.synchronize(true);
}

async function login(agent, username, password) {
    return agent.post("/api/login").send({ username, password });
}

async function createUser(agentOrReq, user) {
    return agentOrReq.post("/api/users").send(user);
}

module.exports = { request, initTestApp, resetDb, login, createUser };
