var express = require('express');
var path = require('path');

var app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

io.set('log level', 2);

server.listen(8081);

app.use(express.static(path.join(__dirname, 'www')));

io.sockets.on('connection', function (socket) {
	global.socket=socket;
  console.log('***Get a connection client id:'+socket.id);
  socket.on('DeviceConnect', OnDeviceConnected);
  socket.on('ConsoleConnect', OnConsoleConnected);
});

var deviceSockets = [];
var consoleSockets = [];

function OnDeviceConnected(data){
	deviceSockets.push(this);
	UpdateDeviceListToConsoles();
	this.on('disconnect', OnDeviceDisconnected);
	console.log('OnDeviceConnected, '+this.id);
}

function OnDeviceDisconnected(){
	deviceSockets.splice(deviceSockets.indexOf(this), 1);
	UpdateDeviceListToConsoles();
	console.log('OnDeviceDisconnected');
}

function OnConsoleConnected(data){
	consoleSockets.push(this);

	this.on('disconnect', OnConsoleDisconnected);

	console.log('Console OnConsoleConnected');
}

function OnConsoleDisconnected(){
	consoleSockets.splice(consoleSockets.indexOf(this), 1);
	console.log('OnConsoleDisconnected');
}

function UpdateDeviceListToConsoles(){
	//send current device list to all consoles for user to select
	var list = [];
	for(var i=0; i<deviceSockets.length; ++i){
		var c = deviceSockets[i];
		var h = c.handshake.headers;
		list.push({ua:h['user-agent'], url:h.referer, addr:c.handshake.address.address});
	}
	for(var i=0; i<consoleSockets.length; ++i){
		consoleSockets[i].emit('DeviceList', list);
	}
}