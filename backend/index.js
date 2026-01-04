require("dotenv").config();
const { AppDataSource } = require("./helpers/db");
const { createApp } = require("./app");

AppDataSource.initialize()
    .then(() => {
        console.log("Database initialized");
        const app = createApp();
        app.listen(process.env.PORT || 1000, () => {
            console.log("Server is running on port", process.env.PORT || 1000);
        });
    })
    .catch((err) => {
        console.error("Error during Data Source initialization", err);
    });
