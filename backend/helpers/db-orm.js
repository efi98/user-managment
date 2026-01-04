const { DataSource } = require('typeorm');
const path = require('node:path');
const { UserEntity } = require('../user');

const dbPath =
    process.env.DB_PATH ||
    path.join(__dirname, '../assets/userdb.sqlite');

const AppDataSource = new DataSource({
    type: 'sqlite',
    database: dbPath,
    synchronize: true,
    logging: false,
    entities: [UserEntity],
});

module.exports = { AppDataSource };
