function getDeviceName (ua) {
	if(ua.indexOf('iPhone')!=-1){
		return 'iPhone';
	}else if(ua.indexOf('iPad')!=-1){
		return 'iPad';
	}else if(ua.indexOf('Android')!=-1){
		return  'Android device';
	}else if(ua.indexOf('BlackBerry')!=-1){
		return 'BlackBerry';
	}else if(ua.indexOf('MeeGo')!=-1){
		return 'MeeGo';
	}else{
		return 'Other device';
	}
}