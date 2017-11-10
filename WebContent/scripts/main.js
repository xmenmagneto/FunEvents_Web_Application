(function() {
	/**
	 * Variables
	 */
	var user_id = '1111';
	var lng = 41.8781;
	var lat = -87.6298;
})();


//自己创建一个$function
function $(tag, options) {
	if (!options) {//没有option的话，就get tag
		return document.getElementById(tag);
	}

	var element = document.createElement(tag);

	for ( var option in options) {
		if (options.hasOwnProperty(option)) {
			element[option] = options[option];
		}
	}
	
	return element;
}

//show loading messages
function showLoadingMessage(msg) {
	var itemList = $('item-list');
	itemList.innerHTML = '<p class="notice"><i class="fa fa-spinner fa-spin"></i> '+ msg + '</p>';
}

function showWarningMessage(msg) {
    var itemList = $('item-list');
    itemList.innerHTML = '<p class="notice"><i class="fa fa-exclamation-triangle"></i> ' + msg + '</p>';
}

function showErrorMessage(msg) {
	var itemList = $('item-list');
	itemList.innerHTML = '<p class="notice"><i class="fa fa-exclamation-circle"></i> ' + msg + '</p>';
}

//adding the active button
function activeBtn(btnId) {
	//取到3个button
	var btns = document.getElementsByClassName('main-nav-btn');

	for (var i = 0; i < btns.length; i++) {
		//去掉active
		btns[i].className =btns[i].className.replace(/\bactive\b/, '');
	}

	// active the one that has id = btnId
	var btn = $(btnId);
	btn.className += ' active';
}


