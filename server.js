const express = require("express");
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const CreatWebSocketServer = require("./WebSocket/ws")
const port = 3310;
const { readDatabase, writeDatabase } = require("./dataBaseHandler")
const { hashPassword, generateToken } = require("./Security/hash");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("Public"));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    next();
});

function generateString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}


app.get("/api/Leaderboard/", (req, res) => {
    let users = readDatabase("./DataBase/users.json");
    res.json(Object.values(users).map(({ Experience, goals, assists, Draws, Losses, last_name, Wins }) => ({ Wins, Experience, goals, assists, Draws, Losses, last_name })))
});

app.get("/api/Listing/", (req, res) => {
    res.json([{
        Address: "localhost",
        Port: port + 1,
        Host: "ZPAYER-TEST",
        Secure: true,
        Public: true,
        Players: 0,
        MaxPlayers: 100,
        Password: false
    }])
})
app.get("/api/Ping", (req, res) => {
    res.json({
        CurrentPlayers: 0,
        MaxPlayers: 100
    })
})
app.post("/api/Signup/", (req, res) => {
    let { username, password } = req.body;
    let users = readDatabase("./DataBase/users.json");
    let { token: Uid, expires, age } = generateToken();
    if (password.length < 8 || password.length > 20) {
        res.json({
            Result: "ERROR",
            Reason: "Password must be between 8 and 20 characters"
        });
        return;
    }
    if (username.length < 3 || username.length > 20 || username.match(/[^a-zA-Z0-9]/)) {
        res.json({
            Result: "ERROR",
            Reason: "Username must be between 3 and 20 characters and can only contain letters and numbers"
        });
        return;
    }
    if (users[username]) {
        res.json({
            Result: "ERROR",
            Reason: "Username already exists"
        });
        return;
    } else {
        let usersSecretDB = readDatabase("./DataBase/secret.json");
        usersSecretDB[username] = {
            password: hashPassword(password),
            Uid,
            expires,
        }
        users[username] = {
            Uid,
            last_name: username,
            Created: 0,
            LastUpdate: 0,
            Wins: 0,
            goals: 0,
            assists: 0,
            Draws: 0,
            Losses: 0,
            Experience: 0
        }
        writeDatabase("./DataBase/secret.json", usersSecretDB);
        writeDatabase("./DataBase/users.json", users);
        res.cookie("Uid", Uid, {
            maxAge: age,
            httpOnly: true,
            secure: true,
            sameSite: "None"
        });
    }
    res.json({ ...users[username], Result: "OK" });
});
app.post("/api/Login/", (req, res) => {
    let { username, password } = req.body;
    let users = readDatabase("./DataBase/users.json");
    let usersSecretDB = readDatabase("./DataBase/secret.json");
    if (password.length < 8 ||
        password.length > 20 ||
        username.length < 3 ||
        username.length > 20 ||
        username.match(/[^a-zA-Z0-9]/) ||
        !usersSecretDB[username] ||
        !users[username] ||
        usersSecretDB[username].password != hashPassword(password)) {
        res.json({
            Result: "ERROR",
            Reason: "Invalid username or password"
        });
        return;
    }
    if (usersSecretDB[username].Uid == req.cookies.Uid) {
        res.json({
            Result: "ERROR",
            Reason: "Already Logged In"
        });
        return;
    }
    if (usersSecretDB[username].password == hashPassword(password)) {
        let { token: Uid, expires, age } = generateToken();
        usersSecretDB[username].Uid = Uid;
        users[username].Uid = Uid;
        res.cookie("Uid", Uid, {
            maxAge: age,
            httpOnly: true,
            secure: true,
            sameSite: "None"
        });
        writeDatabase("./DataBase/secret.json", usersSecretDB);
        writeDatabase("./DataBase/users.json", users);
        res.json({
            Result: "OK",
            ...users[username]
        });
    }
});
app.post("/api/Logout/", (req, res) => {
    let { Uid } = req.cookies;
    if (!Uid) {
        res.json({
            Result: "ERROR",
            Reason: "Error logging out"
        });
        return;
    }
    res.clearCookie("Uid");
    res.location("/");
    res.json({
        Result: "OK",
    });
});




app.get("/api/GetDiscordInvite/", (req, res) => {
    let URLObject = new URL(req.url, "http://localhost");
    let version = Number(URLObject.searchParams.get("version"));
    let discord = process.env.DISCORD;
    res.json({
        image_address: version == 870 ? "/news/images/join_discord_pucks.png" : "/news/images/join_discord_ball.png",
        target_address: discord,
        text_message: ""
    });
});
app.get("/api/GetConfig/", (req, res) => {
    let discord = process.env.DISCORD;
    res.json({
        discord,
    });
});
app.get("/api/GetPlayerRecord/", (req, res) => {
    let { Uid } = req.cookies;
    let users = readDatabase("./DataBase/users.json");
    let finding = Object.values(users).find(user => user.Uid == Uid);
    if (!Uid || !finding) {
        let last_name = "Guest-" + generateString(5);
        res.json({ isGuest:true,Uid:generateToken().token, last_name, Created:0, LastUpdate:0, Wins:0, Draws:0, Losses:0, Experience:0 });
        return;
    }
    let { last_name, Created, LastUpdate, Wins, Draws, Losses, Experience } = finding;
    res.json({ Uid, last_name, Created, LastUpdate, Wins, Draws, Losses, Experience });
});



app.listen(port, () => {
    console.log("server", `http://localhost:${port}`);
});

CreatWebSocketServer(port + 1);