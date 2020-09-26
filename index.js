const express = require("express");
const socket = require("socket.io");

const PORT = process.env.PORT || 5000;
const app = express();
const server = app.listen(PORT, function () {
    console.log(`Listening on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});

app.use(express.static("public"));
const io = socket(server);

// turn off http long polling - force web sockets
// sorry IE9 :(
io.set('transports', ['websocket']);

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