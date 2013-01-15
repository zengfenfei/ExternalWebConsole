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
	//this.bufferedLogs=[];
	deviceSockets.push(this);
	UpdateDeviceListToConsoles();
	this.on('DeviceLog', OnDeviceLog);
	this.on('disconnect', OnDeviceDisconnected);
	console.log('OnDeviceConnected, '+this.id);
}

function OnDeviceDisconnected(){
	deviceSockets.splice(deviceSockets.indexOf(this), 1);
	if(this.consoleSocket){	//matched by a console
		this.consoleSocket.emit('Unmatch');
		delete this.consoleSocket.deviceSocket;
		delete this.consoleSocket;
	}else{
		UpdateDeviceListToConsoles();
	}	
	console.log('OnDeviceDisconnected');
}

function OnConsoleConnected(data){
	consoleSockets.push(this);

	UpdateDeviceListToConsoles();

	this.on('Match', OnMatch);
	this.on('ExecScript', OnExecScript);
	this.on('disconnect', OnConsoleDisconnected);

	console.log('Console OnConsoleConnected');
}

function OnConsoleDisconnected(){
	consoleSockets.splice(consoleSockets.indexOf(this), 1);
	if(this.deviceSocket){
		this.deviceSocket.emit('Unmatch');
		delete this.deviceSocket.consoleSocket;
		delete this.deviceSocket;
		UpdateDeviceListToConsoles();
	}
	console.log('OnConsoleDisconnected');
}

function UpdateDeviceListToConsoles(){
	//send current device list to all consoles for user to select
	var list = [];
	for(var i=0; i<deviceSockets.length; ++i){
		var c = deviceSockets[i];
		if(c.consoleSocket)
			continue;
		var h = c.handshake.headers;
		list.push({id:c.id,ua:h['user-agent'], url:h.referer, addr:c.handshake.address.address});
	}
	for(var i=0; i<consoleSockets.length; ++i){
		consoleSockets[i].emit('DeviceList', list);
	}
}

function OnMatch(id){
	if(this.deviceSocket){	//Already mathed with a device
		this.deviceSocket.emit('Unmatch');
		delete this.deviceSocket.consoleSocket;
		delete this.deviceSocket;
		
	}
	for(var i=0; i<deviceSockets.length; i++){
		if(deviceSockets[i].id == id){
			var target = deviceSockets[i];
			if(target.consoleSocket){
				this.emit('Match', {code:2, msg:'The device is connected to another console.'});
				return;
			}
			target.consoleSocket = this;
			this.deviceSocket = target;
			var c = target;
			var h = c.handshake.headers;
			this.emit('Match', {
				code:0,
				target:{
					id:c.id,
					ua:h['user-agent'],
					url:h.referer,
					addr:c.handshake.address.address
				}
			});
			target.emit('Match', this.id);
			UpdateDeviceListToConsoles();
			console.log('Console '+this.id+' is connnected to '+id);
			return;
		}
	}
	this.emit('Match', {code:1, msg:'The device is onffline now'})
}

function OnDeviceLog(log){
	if(this.consoleSocket){
		this.consoleSocket.emit('DeviceLog', log);
		console.log('Send device log to console...', log);
	}else{
		console.error('Device send log when no console connected.');
	}
}

function OnExecScript(script){
	if(!this.deviceSocket){
		console.error('Fail to ExecScript on target, no device connected to this console');
		return;
	}
	this.deviceSocket.emit('ExecScript', script);
}