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
		saved_metrics = JSON.parse(fs.readFileSync('metrics.txt', 'utf8'));
		new_metrics = JSON.parse(data);

		Object.keys(new_metrics).forEach(function(key,index) {
			if (saved_metrics.hasOwnProperty(key)) {
		    saved_metrics[key] = saved_metrics[key] + new_metrics[key];
		  } else {
		    saved_metrics[key] = new_metrics[key];
		  }

		});

		fs.writeFile("metrics.txt", JSON.stringify(saved_metrics), (err) => {
  		if (err) console.log(err);
  		console.log("Successfully Written to File.");
			socket.disconnect(socket.id);
		});	
	});
});
