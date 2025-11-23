const express = require("express");
const cors = require("cors");
const fs = require("fs");
const {User, UpdateUser} = require('./user');
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = './assets/example.json';
const SALT_ROUNDS = 10;

const readUsers = () => {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
};

const writeUsers = (users) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
};

app.get("/", (req, res) => {
    res.send("hello");
});

app.get("/users", (req, res) => {
    const users = readUsers();
    res.json(users);
});

app.get("/users/:username", (req, res) => {
    const users = readUsers();
    const {params} = req;
    const user = users.find(u => u.username === params.username);

    if (!user) {
        return res.status(404).json({error: "User not found"});
    }
    const {password: _, ...userSafe} = user;
    res.json(userSafe);
});

app.post("/users", (req, res) => {
    try {
        const users = readUsers();
        const {body} = req;
        const {username, password, displayName, age, gender, ...extraFields} = body;

        if (Object.keys(extraFields).length > 0) {
            return res.status(400).json({
                error: `Forbidden fields: ${Object.keys(extraFields).map(f => `'${f}'`).join(', ')}.`

            });
        }

        const existingUser = users.find(u => u.username === username);
        if (existingUser) {
            const suggestions = [];
            while (suggestions.length < 3) {
                const suggestion = `${username}${Math.floor(Math.random() * 1000)}`;
                if (!users.find(u => u.username === suggestion)) {
                    suggestions.push(suggestion);
                }
            }
            return res.status(409).json({
                error: "Username already exists",
                suggestions
            });
        }
        const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS);
        const newUser = new User(username, passwordHash, displayName, age, gender);
        newUser.validate();
        users.push(newUser);
        writeUsers(users);
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({error: error.message});
    }
});

app.post("/login", (req, res) => {
    const users = readUsers();
    const {username, password} = req.body;

    const user = users.find(u => u.username === username);

    if (!user) {
        return res.status(404).json({error: "User not found"});
    }

    const isMatch = bcrypt.compareSync(password, user.password);

    if (!isMatch) {
        return res.status(401).json({error: "Incorrect password"});
    }

    const {password: _, ...userSafe} = user;

    res.json(userSafe);
});

app.patch("/users/:username", (req, res) => {
    try {
        const users = readUsers();
        const {params, body} = req;

        const index = users.findIndex(u => u.username === params.username);

        if (index === -1) {
            return res.status(404).json({error: "User not found"});
        }
        const existingUser = users[index];

        const {password, displayName, age, gender, isAdmin, ...extraFields} = body;

        if (Object.keys(extraFields).length > 0) {
            return res.status(400).json({
                error: `Forbidden fields: ${Object.keys(extraFields).map(f => `'${f}'`).join(', ')}.`
            });
        }

        let newPasswordHash = existingUser.password;
        if (password) {
            newPasswordHash = bcrypt.hashSync(password, SALT_ROUNDS);
        }

        const updatedUser = new UpdateUser(
            existingUser.username,
            newPasswordHash,
            displayName || existingUser.displayName,
            age || existingUser.age,
            gender || existingUser.gender,
            isAdmin ?? existingUser.isAdmin,
            existingUser.createdAt);

        updatedUser.validate();

        users[index] = updatedUser;
        writeUsers(users);
        const {password: _, ...updatedUserSafe} = updatedUser;
        res.json(updatedUserSafe);
    } catch (error) {
        res.status(400).json({error: error.message});
    }
});

app.delete("/users/:username", (req, res) => {
    const users = readUsers();
    const {params} = req;

    const filteredUsers = users.filter(u => u.username !== params.username);

    if (users.length === filteredUsers.length) {
        return res.status(404).json({error: "User not found"});
    }

    writeUsers(filteredUsers);
    res.status(204).send();
});

app.listen(process.env.PORT || 1000, function () {
    console.log("Server is running on port", process.env.PORT || 1000);
});
