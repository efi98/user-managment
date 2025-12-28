const { DataSource } = require('typeorm');
const path = require('node:path');
const { UserEntity } = require('../user');

const AppDataSource = new DataSource({
    type: 'sqlite',
    database: path.join(__dirname, '../assets/userdb.sqlite'),
    synchronize: true,
    logging: false,
    entities: [UserEntity],
});

module.exports = { AppDataSource };
