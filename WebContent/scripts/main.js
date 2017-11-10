(function() {
	/**
	 * Variables
	 */
	var user_id = '1111';
	var lng = 41.8781;
	var lat = -87.6298;
	
	//initialization
	function init() {
		// Register event listeners
		$('nearby-btn').addEventListener('click', loadNearbyItems);
		$('fav-btn').addEventListener('click', loadFavoriteItems);
		$('recommend-btn').addEventListener('click', loadRecommendedItems);

		initGeoLocation();
	}

	
	function initGeoLocation() {
		if (navigator.geolocation) { //浏览器自带
			navigator.geolocation.getCurrentPosition(onPositionUpdated,
					onLoadPositionFailed, {
						maximumAge : 60000
					});
			showLoadingMessage('Retrieving your location...');
		} else {
			onLoadPositionFailed();
		}
	}

	function onPositionUpdated(position) {
		lat = position.coords.latitude;
		lng = position.coords.longitude;

		loadNearbyItems();
	}
	
	function onLoadPositionFailed() {
		console.warn('navigator.geolocation is not available');
		getLocationFromIP(); //get geolocation from ip
	}

	function getLocationFromIP() {
		// Get location from http://ipinfo.io/json
		var url = 'http://ipinfo.io/json'
		var req = null;
		ajax('GET', url, req, function(res) {
			var result = JSON.parse(res);
			if ('loc' in result) {
				var loc = result.loc.split(',');
				lat = loc[0];
				lng = loc[1];
			} else {
				console.warn('Getting location by IP failed.');
			}
			loadNearbyItems();
		});
	}


	

	/**
	 * AJAX helper
	 * 
	 * @param method - GET|POST|PUT|DELETE
	 * @param url - API end point
	 * @param callback - This the successful callback
	 * @param errorHandler - This is the failed callback
	 */
	function ajax(method, url, data, callback, errorHandler) {
	  var xhr = new XMLHttpRequest();

	  xhr.open(method, url, true);

	  //backend传回来之后执行
	  xhr.onload = function () {
	    switch (xhr.status) {
	      case 200:
	        callback(xhr.responseText);
	        break;
	      case 403:
	    	  	onSessionInvalid();
	      case 401:
	        errorHandler();
	        break;
	    }
	  };

	  
	  //api call失败, backend没有穿回来，中间出现的情况
	  xhr.onerror =function () {
	    console.error("The request couldn't be completed.");
	    errorHandler();
	   };

	  if (data === null) {//没有传资料进来
	    xhr.send();
	  } else {
	    xhr.setRequestHeader("Content-Type", "application/json;charset=utf-8");
	    xhr.send(data);
	  }
	}
	
	
	/**
	 * API #1 Load the nearby items API end point: [GET]
	 * /Titan/search?user_id=1111&lat=41.8781&lon=-87.6298
	 */
	function loadNearbyItems() {
		console.log('loadNearbyItems');
		activeBtn('nearby-btn');

		// The request parameters
		var url = './search';
		var params = 'user_id=' + user_id + '&lat=' + lat + '&lon=' + lng; //之前算出来的
		var req = JSON.stringify({});

		// display loading message
		showLoadingMessage('Loading nearby items...');

		// make AJAX call
		ajax('GET', url + '?' + params, req,
		// successful callback
		function(res) {
			var items = JSON.parse(res);  //js array
			if (!items || items.length === 0) {
				showWarningMessage('No nearby item.');
			} else {
				listItems(items); //创建一个一个list item, 展示出来
			}
		},
		// failed callback
		function() {
			showErrorMessage('Cannot load nearby items.');
		});
	}

	/**
	 * API #2 Load favorite (or visited) items API end point: [GET]
	 * /Titan/history?user_id=1111
	 */
	function loadFavoriteItems() {
		activeBtn('fav-btn');

		// The request parameters
		var url = './history';
		var params = 'user_id=' + user_id;

		var req = JSON.stringify({}); //convert json object to json string, parse--> json string to json object

		// display loading message
		showLoadingMessage('Loading favorite items...');

		// make AJAX call
		ajax('GET', url + '?' + params, req, function(res) {
			var items = JSON.parse(res);
			if (!items || items.length === 0) {
				showWarningMessage('No favorite item.');
			} else {
				listItems(items);
			}
		}, function() {
			showErrorMessage('Cannot load favorite items.');
		});
	}

	/**
	 * API #3 Load recommended items API end point: [GET]
	 * /Titan/recommendation?user_id=1111
	 */
	function loadRecommendedItems() {
		activeBtn('recommend-btn');

		// The request parameters
		var url = './recommend';
		var params = 'user_id=' + user_id + '&lat=' + lat + '&lon=' + lng;

		var req = JSON.stringify({});

		// display loading message
		showLoadingMessage('Loading recommended items...');

		// make AJAX call
		ajax('GET', url + '?' + params, req,
				// successful callback
				function(res) {
					var items = JSON.parse(res);
					if (!items || items.length === 0) {
						showWarningMessage('No recommended item. Make sure you have favorites.');
					} else {
						listItems(items);
					}
				},
				// failed callback
				function() {
					showErrorMessage('Cannot load recommended items.');
				});
	}
	
	/**
	 * API #4 Toggle favorite (or visited) items
	 * 
	 * @param item_id -
	 *            The item business id
	 * 
	 */
	function changeFavoriteItem(item_id) {
		// Check whether this item has been visited or not
		var li = $('item-' + item_id); //找到这个item
		var favIcon = $('fav-icon-' + item_id); //找到icon
		var favorite = li.dataset.favorite !== 'true';

		// The request parameters
		var url = './history';
		var req = JSON.stringify({
			user_id : user_id,
			favorite : [ item_id ]
		});
		//本来不是favorite -> post request
		//本来是favorite -> delete request
		var method = favorite ? 'POST' : 'DELETE'; 
		ajax(method, url, req,
				// successful callback
				function(res) {
					var result = JSON.parse(res);
					if (result.result === 'SUCCESS') {
						li.dataset.favorite = favorite;  //变成新的favorite
						favIcon.className = favorite ? 'fa fa-heart' : 'fa fa-heart-o'; //更新icon
					}
				});
			}


	
	//create item list
	//param items - an array of item JSON objects
	function listItems(items) {
		// Clear the current results
		var itemList = $('item-list');
		//清空之前的内容
		itemList.innerHTML = '';

		for (var i = 0; i < items.length; i++) {
			addItem(itemList, items[i]);
		}
	}
	
	
	//Creating HTML component from json
	//add item to the list
	//param: itemList <ul id="item-list"> tag
	//param: item - the item data(JSON object)
	
	function addItem(itemList, item) {
		var item_id = item.item_id;

		// create the <li> tag and specify the id and class attributes
		var li = $('li', {
			id : 'item-' + item_id,
			className : 'item'
		});

		// set the data attribute
		li.dataset.item_id = item_id;
		li.dataset.favorite = item.favorite;

		// item image
		if (item.image_url) {//if image url exists
			li.appendChild($('img', {
				src : item.image_url
			}));
		} else {//no image url exists, set a default image
			li.appendChild($('img', {
				src : '../images/default.jpg'
			}))
		}
		// section, 创建div
		var section = $('div', {});

		// title
		var title = $('a', {
			href : item.url,
			target : '_blank', //开在哪里？开在新的地方
			className : 'item-name'
		});
		title.innerHTML = item.name;
		section.appendChild(title);
		
		
		// category
		var category = $('p', {
			className : 'item-category'
		});
		category.innerHTML = 'Category: ' + item.categories.join(', '); //把categories中每个element用逗号分开
		section.appendChild(category); //放在div下面

		var stars = $('div', {
			className : 'stars'
		});
		
		for (var i = 0; i < item.rating; i++) {
			var star = $('i', {
				className : 'fa fa-star'
			});
			stars.appendChild(star);
		}

		//regular expression: 0.5,产生半颗星，放一半星星
		if (('' + item.rating).match(/\.5$/)) {
			stars.appendChild($('i', {
				className : 'fa fa-star-half-o'
			}));
		}
		section.appendChild(stars);

		li.appendChild(section);
		

		// address
		var address = $('p', {
			className : 'item-address'
		});

		//address.innerHTML = item.address.replace(/,/g, '<br/>').replace(/\"/g,'');
		var addressHTML =  item.address + "<br/>" + item.city;
		address.innerHTML = addressHTML;

		li.appendChild(address);
		
		
		// favorite link
		var favLink = $('p', {
			className : 'fav-link'
		});

		
		favLink.onclick = function() {
			changeFavoriteItem(item_id); //改变favorite 属性
		};

		favLink.appendChild($('i', {
			id : 'fav-icon-' + item_id,
			className : item.favorite ? 'fa fa-heart' : 'fa fa-heart-o'  //实心？空心？
		}));

		li.appendChild(favLink);

		itemList.appendChild(li);
	}
	
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
	
	//call init()
	init();
})();







