const express = require("express");
const socket = require("socket.io");

const PORT = process.env.PORT || 5000;
const app = express();
const server = app.listen(PORT, function () {
    console.log(`Listening on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});

app.use(function (req, res, next) {

    var str = "www.";
    if (req.hostname.indexOf(str) !== 0) {
        const secureUrl = 'https://www.' + req.hostname + req.originalUrl
        res.redirect(302, secureUrl)
    }

    if (req.headers['x-forwarded-proto'] !== 'https' && req.hostname !== 'localhost') {
        const secureUrl = 'https://www.' + req.hostname + req.originalUrl
        res.redirect(302, secureUrl)
    }
    next()
})

app.use(express.static("public"));
const io = socket(server);

const activeUsers = new Set();


io.on("connection", function (socket) {
    console.log("Made socket connection");

    socket.on("new user", function (data) {
        socket.userId = data;
        activeUsers.add(data);
        io.emit("new user", [...activeUsers]);
    });

    socket.on("disconnect", () => {
        activeUsers.delete(socket.userId);
        io.emit("user disconnected", socket.userId);
    });

    socket.on("message bus", function (data) {
        io.emit("message bus", data);
    });

    socket.on("clear", function (data) {
        io.emit("clear all", data);
    });

});