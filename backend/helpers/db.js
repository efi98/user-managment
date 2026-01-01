const {AppDataSource} = require('./db-orm');
const {UserEntity} = require('../user');

async function readUsers() {
    const repo = AppDataSource.getRepository(UserEntity);
    const result = await repo.find();
    return Array.isArray(result) ? result : [];
}

async function writeUsers(users) {
    const repo = AppDataSource.getRepository(UserEntity);
    await repo.clear();
    // Always save plain objects, not class instances
    const plainUsers = users.map(u => ({
        username: u.username,
        password: u.password,
        displayName: u.displayName,
        age: u.age,
        gender: u.gender,
        isAdmin: u.isAdmin,
        profilePhoto: u.profilePhoto,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt
    }));
    await repo.save(plainUsers);
}

module.exports = {readUsers, writeUsers, AppDataSource};
