const { DataSource } = require('typeorm');
const path = require('node:path');
const { UserEntity } = require('../user');

const dbPath =
    process.env.DB_PATH ||
    (process.env.NODE_ENV === 'test'
        ? path.join(__dirname, '../assets/test.sqlite')
        : path.join(__dirname, '../assets/userdb.sqlite'));

const AppDataSource = new DataSource({
    type: 'sqlite',
    database: dbPath,
    synchronize: true,
    logging: false,
    entities: [UserEntity],
});

module.exports = { AppDataSource };
