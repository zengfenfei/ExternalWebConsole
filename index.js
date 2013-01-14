var express = require('express');
var path = require('path');

var app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

server.listen(8081);

app.use(express.static(path.join(__dirname, 'www')));

io.sockets.on('connection', function (socket) {
  console.log('Get a connection...');
  socket.on('DeviceConnect', OnDeviceConnected);
  socket.on('ConsoleConnect', OnConsoleConnected);
});

function OnDeviceConnected(data){
	this.on('disconnect', OnDeviceDisconnected);
	console.log('OnDeviceConnected');
}

function OnDeviceDisconnected(){
	console.log('OnDeviceDisconnected')
}

function OnConsoleConnected(data){
	this.on('disconnect', OnConsoleDisconnected);
	console.log('Console OnConsoleConnected');
}

function OnConsoleDisconnected(){
	console.log('OnConsoleDisconnected');
}