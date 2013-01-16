/**
Use this file as the first script for the html page where you want debug.
*/
(function(global){


	function ExternalConsole(){
		var scripts = document.getElementsByTagName('script');
		var parts = scripts[scripts.length-1].src.split('/');
		this.host = parts[0]+'//'+parts[2];
		this.bufferedLogs=[];
		this.matched = false;
		var statusBar = this.statusBar = document.createElement('div');

		window.addEventListener('load', function(){
			document.body.appendChild(document.createElement('hr'));
			document.body.appendChild(statusBar);
			window.removeEventListener('load', arguments.callee, false);
		}, false);
	}
	ExternalConsole.prototype.sendOutput = function(type, argv) {
		var transportedArgv = [];	//safe to stringify
		for(var i=0; i<argv.length; i++){
			try{
				var str = JSON.stringify(argv[i]);
				if(	!str
					||(argv[i] instanceof RegExp)
					||(argv[i] instanceof Error)){
					transportedArgv.push(argv[i]+'');
				}else{
					transportedArgv.push(argv[i]);
				}
			}catch(e){
				//alert(e);
				var obj = {};
				for(var k in argv[i]){
					obj[k]=''+argv[i][k];
				}
				transportedArgv.push(obj);
				//alert('ok');
			}				
		}
		var callStack = new Error().stack;
		if(callStack){
			//alert(callStack.split('\n').length);
			var codeInfo = callStack.split('\n    at ')[3];
			transportedArgv.push('\t <-- ' + codeInfo);
		}
		
		//console.debug0('Going to send log',type, argv);
		var log = {type:type, argv:transportedArgv};
		if(this.matched){
			this.socket.emit('DeviceLog', log);
		}else{
			this.bufferedLogs.push(log);
			//alert('buffer log '+JSON.stringify(transportedArgv));
		}
	};
	ExternalConsole.prototype.connect = function(host) {
		this.host = host || this.host;
		this.socket = io.connect(this.host);
		this.socket.externalConsole = this;
		this.socket.on('connect', this.onServerConnected);
		this.socket.on('Match', this.onConsoleConnected);
		this.socket.on('Unmatch', this.onConsoleDisconnected);
		this.socket.on('ExecScript', this.onExecScript);
	};
	ExternalConsole.prototype.onServerConnected = function() {
		this.emit('DeviceConnect');
		this.externalConsole.updateStatus('Connected to server...');
		this.externalConsole.updateStatus('Your page id: '+this.socket.sessionid);
	};
	ExternalConsole.prototype.onConsoleConnected = function(id) {
		var ext = this.externalConsole;
		ext.matched = true;
		var logs = ext.bufferedLogs;
		for(var i=0; i<logs.length; i++){
			this.emit('DeviceLog', logs[i]);
		}
		logs.length=0;
		ext.updateStatus('Matched with external web console: '+id);
	};
	ExternalConsole.prototype.onConsoleDisconnected = function() {
		this.externalConsole.updateStatus('Unmatched with console.');
		this.externalConsole.matched = false;
	};
	ExternalConsole.prototype.onExecScript = function(script) {
		//alert('Get script:'+script);
		eval(script);
	};
	ExternalConsole.prototype.updateStatus = function(info) {
		this.statusBar.innerHTML+=info+'<br>';
	};

	var externalConsole = new ExternalConsole();
	externalConsole.connect();

	function handleUncaughtException(msg, url, line){
		//alert(msg + '\t <-- ' + url + ':' + line);
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
			this[fn+'0'].apply(this, arguments);
			externalConsole.sendOutput(fn, arguments);
		};
	}

	console.log0('ExternalWebConsole---');
})(window);