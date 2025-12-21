const fs = require('fs');
const DATA_FILE = './assets/example.json';

function readUsers() {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

function writeUsers(users) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

module.exports = { readUsers, writeUsers };
