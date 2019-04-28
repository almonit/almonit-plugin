// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 1981;
var fs = require("fs");

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});


io.on('connection', function (socket) {
	console.log("connected");

	socket.on("metrics", function (data) {
		console.log("data received: " + data);
		fs.writeFile("metrics.txt", data, (err) => {
  		if (err) console.log(err);
  		console.log("Successfully Written to File.");
			socket.disconnect(socket.id);
		});	
	});
});
