const mysql = require('./views/database.js');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const encoder = bodyParser.urlencoded();

app.get('/login', function(req, res) {
    res.sendFile(__dirname + "/login.html");
})

app.post('/login', encoder, function(req, res) {
    let login = res.body.login;
    let password = res.body.password
    mysql.query("SELECT * FROM `users", [login, password], function(error, result) {
        if (result.length > 0) {
            res.redirect("../../views/index.ejs");
        } else {
            res.redirect("/login.html");
        }
        res.end();
    });
})

app.get("/index", function(req, res) {
    res.sendFile(__dirname + "/index.ejs")
})

app.listen(8080);