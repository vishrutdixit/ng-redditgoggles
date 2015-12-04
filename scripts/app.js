
/* Opt-in for bootstrap js */
$(function () {
  $('[data-toggle="tooltip"]').tooltip()
})

/* -------- ANGULAR ------- */
var app = angular.module('app', ['ngAnimate']); 

app.controller('searchController', ['$scope', '$sce', 'dataFactory', function($scope, $sce, dataFactory) {
    $scope.subreddit = '';
    $scope.sidebarHeader = '';
    $scope.mediaData = 	JSON.parse(localStorage.getItem('mediaData')) || {};
    $scope.nextCounter = JSON.parse(localStorage.getItem('nextCounter')) || 25; 
    $scope.haveSearched = JSON.parse(localStorage.getItem('haveSearched')) || false;
    $scope.canLoad = JSON.parse(localStorage.getItem('canLoad')) || false; 
    $scope.showSidebar = JSON.parse(localStorage.getItem('showSidebar')) || false;
    $scope.isContent = JSON.parse(localStorage.getItem('isContent')) || false; 
    $scope.selectedMedia = JSON.parse(localStorage.getItem('selectedMedia')) || {};
    
    
    $scope.keypress = function(e) {
        var downIndex = $scope.mediaData.media.indexOf($scope.selectedMedia) + 1;
        var upIndex = $scope.mediaData.media.indexOf($scope.selectedMedia) - 1;
        if(downIndex >= $scope.mediaData.media.length) downIndex = $scope.mediaData.media.length - 1;
        if(upIndex < 0) upIndex = 0;
        if(e.keyCode == 40) $scope.selectMedia(           
            $scope.mediaData.media[downIndex]);
        if(e.keyCode == 38) $scope.selectMedia(              
            $scope.mediaData.media[upIndex]);
    }

    /*
    $scope.$watchGroup([
    	'videoData',
    	'gifData',
    	'nextCounter',
    	'haveSearched',
    	'canLoad',
    	'showSidebar',
    	'isContent',
    	'selectedMedia'
    	], function(newValues, oldValues){
    	if(newValues[0] != oldValues[0]) { localStorage.setItem('videoData', JSON.stringify(newValues[0])); }
    	if(newValues[1] != oldValues[1]) { localStorage.setItem('gifData', JSON.stringify(newValues[1])); }
    	if(newValues[2] != oldValues[2]) { localStorage.setItem('nextCounter', JSON.stringify(newValues[2])); }
    	if(newValues[3] != oldValues[3]) { localStorage.setItem('haveSearched', JSON.stringify(newValues[3])); }
    	if(newValues[4] != oldValues[4]) { localStorage.setItem('canLoad', JSON.stringify(newValues[4])); }
    	if(newValues[5] != oldValues[5]) { localStorage.setItem('showSidebar', JSON.stringify(newValues[5])); }
    	if(newValues[6] != oldValues[6]) { localStorage.setItem('isContent', JSON.stringify(newValues[6])); }
    	if(newValues[7] != oldValues[7]) { localStorage.setItem('selectedMedia', JSON.stringify(newValues[7])); }

    });
	*/
	

    $scope.trustSrc = function(src) {
    	return $sce.trustAsResourceUrl(src);
  	}	
    
    $scope.selectMedia = function(media){
		NProgress.start();
		$scope.selectedMedia = media;
		$scope.isContent = true;
		if($scope.selectedMedia.type == 'gfycat') {
			dataFactory.displayGfycat();
		}

		NProgress.done();
	};

    $scope.toggleSidebar = function(){
		if($scope.haveSearched) {
			if($scope.showSidebar) $scope.showSidebar = false;
			else $scope.showSidebar = true;
		}
	};

    $scope.fetchMedia = function(){
    	NProgress.start();
    	dataFactory.getMedia($scope.subreddit).then(function(res){
	    	$scope.mediaData = res;
	    	//console.log($scope.videoData);
	    	$scope.canLoad = true;
	    	$scope.haveSearched = true;
	    	$scope.showSidebar = true;
	    	$scope.nextCounter = 25; 
	    	$scope.sidebarHeader = $scope.subreddit;
	    	NProgress.done();
    	}, function(reason){
    		console.log(reason);
    		NProgress.done();
    	});
    };

    $scope.getNext = function(){
    	NProgress.start();
    	//console.log($scope.nextCounter, $scope.videoData.after)
    	dataFactory.getMedia($scope.subreddit, $scope.nextCounter, $scope.mediaData.after).then(function(res){
    		if(res.media.length) {
	    		for(var i=0; i<res.media.length; i++) {
	    			$scope.mediaData.media.push(res.media[i]);
	    		}
	    		$scope.mediaData.after = res.after;
    		}
    		NProgress.done();
    		if($scope.mediaData.after == null) $scope.canLoad = false;
    	});
   
    	$scope.nextCounter += 25;
    };

    $scope.toggleMedia = function() {
    	if($scope.mediaType) {
    		$scope.mediaType = false; 
    		$scope.mediaText = 'GIF';
    	}
    	else {
    		$scope.mediaType = true; 
    		$scope.mediaText = 'YT';
    	} 
    	
    };

}]);

app.factory('dataFactory', function($http, $q){
	
	var service = {};
	var baseUrl = 'http://www.reddit.com/r/';
	var finalUrl = '';
	service.data = {};

	service.displayGfycat = function() {
		alert();
		 elem_coll = $(".gfyitem");
		 console.log(elem_coll[0]);
            for (var i = 0; i < elem_coll.length; i++) {
                var gfyObj1 = new gfyObject(elem_coll[i]);
                console.log(giyObj1);
                gfyObj1.init();
            }
	}

	service.getAll = function(subreddit, count, after){
		if(count && after) 
			finalUrl = baseUrl + subreddit + '/.json' + '?count=' + count + '&after=' + after;
		else 
			finalUrl = baseUrl + subreddit + '/.json';
		var deferred = $q.defer();
		$http.get(finalUrl)
		.success(function(res){
			service.data = res.data;
			//console.log(res.data);
			deferred.resolve(res);
		})
		.error(function(err, status){
			deferred.reject(err);
			
		})
		//console.log(deferred.promise);
		return deferred.promise;
	}

	service.getMedia = function(subreddit, count, after) {	
		var deferred = $q.defer();
		service.getAll(subreddit, count, after).then(function(res){
			//console.log('inside getMedia');
			var data = {};
			var media = []; 
			
			var after = service.data.after;
			$.each(service.data.children, function(i, post){
				var title = post.data.title; 
				var upvotes = post.data.ups;
				if(post.data.domain == 'youtube.com' || post.data.domain == 'youtu.be'){
					var thumbUrl = '';
					var embedUrl = '';
					var initUrl = post.data.url; 
					var subUrl = ''; 
					var filterIndex, _filterIndex; 

					if(post.data.domain == 'youtube.com'){
						filterIndex = initUrl.indexOf('=');
		                filterIndex++; 
		                subUrl = initUrl.substring(filterIndex); 
					}
					else if(post.data.domain == 'youtu.be'){
						filterIndex = initUrl.indexOf('be/');
		                filterIndex+=3; 
		                subUrl = initUrl.substring(filterIndex); 
					}
					if(subUrl.indexOf('?') >= 0) {
		                _filterIndex = subUrl.indexOf('?');
		                subUrl = subUrl.substring(0, _filterIndex);
		            }
		            if(subUrl.indexOf('&') >= 0){
		            	_filterIndex = subUrl.indexOf('&');
		            	subUrl = subUrl.substring(0, _filterIndex);
		            }
		            if(subUrl.indexOf('#') >= 0){
		            	_filterIndex = subUrl.indexOf('#');
		            	subUrl = subUrl.substring(0, _filterIndex);
		            }

		            embedUrl = '//www.youtube.com/embed/' + subUrl + 
		            '?rel=0&modestbranding=1&hd=1&showinfo=0&controls=1&iv_load_policy=3&wmode=transparent&autohide=1&autoplay=0';
		            thumbUrl = 'http://img.youtube.com/vi/' + subUrl + '/hqdefault.jpg';

		            var video = {}; 
		            video['title'] = title;
		            video['thumbUrl'] = thumbUrl;
		            video['embedUrl'] = embedUrl; 
		            video['upvotes'] = upvotes;
		            video['type'] = 'ytvideo';

		            media.push(video);
		            NProgress.inc();
		            
				}

				if(post.data.domain == 'i.imgur.com' || post.data.domain == 'imgur.com') {
					if(post.data.url.includes('gif')) {
						var thumbUrl = post.data.thumbnail;
						var embedUrl = post.data.url + '#embed';
						
						var gif = {}; 
			            gif['title'] = title;
			            gif['thumbUrl'] = thumbUrl;
			            gif['embedUrl'] = embedUrl; 
			            gif['upvotes'] = upvotes;
			            gif['type'] = 'gif';

			            media.push(gif);
			            NProgress.inc();
		            }
				}

				if(post.data.domain == 'gfycat.com') {
					var embedUrl = post.data.url.replace('http://gfycat.com/', '').replace('https://gfycat.com/', '').replace('http://www.gfycat.com/', '').replace('#','');
					if(embedUrl.indexOf('?')>= 0) {
						var filterIndex = embedUrl.indexOf('?');
						embedUrl = embedUrl.substring(0, filterIndex);
					}
					//console.log(embedUrl);
					var thumbUrl = 'http://thumbs.gfycat.com/' + embedUrl + '-poster.jpg';

					var gfycat = {}
					gfycat['title'] = title;
			        gfycat['thumbUrl'] = thumbUrl;
			        gfycat['embedUrl'] = embedUrl; 
			        gfycat['upvotes'] = upvotes;
			        gfycat['type'] = 'gfycat';

			        media.push(gfycat);
			        NProgress.inc();
				}
			});
			//console.log(after);
			
			data['after'] = after;
			data['media'] = media;

			deferred.resolve(data);
		}, function(reason){
			deferred.reject(reason);
		});
		//console.log(deferred.promise);
		return deferred.promise;
	};

	return service;
});


