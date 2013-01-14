/**
Use this file as the first script for the html page where you want debug.
*/
(function(global){

	function ExternalConsole(){
		var scripts = document.getElementsByTagName('script');
		var parts = scripts[scripts.length-1].src.split('/');
		this.host = parts[0]+'//'+parts[2];
	}
	ExternalConsole.prototype.sendOutput = function(type, msg) {
		// body...
	};
	ExternalConsole.prototype.connect = function(host) {
		this.host = host || this.host;
		this.socket = io.connect(this.host);
		this.socket.emit('DeviceConnect');
		console.log('Connected to server '+this.host);
	};

	var externalConsole = new ExternalConsole();
	externalConsole.connect();

	function handleUncaughtException(msg, url, line){
		console.error(msg + '\t <-- ' + url + ':' + line);
		return true;
	}

	global.addEventListener('error', function(evt){
		return handleUncaughtException(evt.message, evt.filename, evt.lineno);
	}, false);

	var mockMethods = ['assert', 'debug', 'dir', 'log', 'info', 'error', 'warn'];
	for(var i=0; i<mockMethods.length; i++){
		createMockMethod(console, mockMethods[i]);
	}
	function createMockMethod(target,  fn){
		target[fn+'0'] = target[fn];
		target[fn] = function(){
			var args=[];
			for(var i=0; i<arguments.length; i++){
				try{
					args.push(JSON.stringify(arguments[i]));
				}catch(e){
					args.push('[Circular]');
				}				
			}
			target[fn+'0'].apply(target, arguments);
			externalConsole.sendOutput(fn, JSON.stringify(args));
		};
	}

	console.log('ExternalWebConsole---');
})(window);