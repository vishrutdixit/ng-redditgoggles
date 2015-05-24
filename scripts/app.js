var app = angular.module('app', []); 

app.controller('searchController', ['$scope', 'dataFactory', function($scope, dataFactory) {
    $scope.subreddit = '';
    $scope.videoData = {};
    $scope.gifData = {};
    $scope.nextCounter = 25; 

    $scope.canLoad = false; 
    $scope.wantVideo = true; 
    $scope.wantGif = false; 
    $scope.wantPic = false;
    $scope.mediaText = 'YT';

    $scope.fetchMedia = function(){
    	NProgress.start();
    	dataFactory.getMedia($scope.subreddit).then(function(res){
	    	$scope.videoData = res.videoData; 
	    	$scope.gifData = res.gifData;
	    	//console.log($scope.videoData);
	    	$scope.canLoad = true;
	    	$scope.nextCounter = 25; 
	    	NProgress.done();
    	}, function(reason){
    		console.log(reason);
    		NProgress.done();
    	});
    };

    $scope.getNext = function(){
    	NProgress.start();
    	//console.log($scope.nextCounter, $scope.videoData.after)
    	dataFactory.getMedia($scope.subreddit, $scope.nextCounter, $scope.videoData.after).then(function(res){
    		if(res.videoData.videos.length) {
	    		for(var i=0; i<res.videoData.videos.length; i++) {
	    			$scope.videoData.videos.push(res.videoData.videos[i]);
	    		}
	    		$scope.videoData.after = res.videoData.after;
    		}
    		NProgress.done();
    		if($scope.videoData.after == null) $scope.canLoad = false;
    	});
    	
    	dataFactory.getMedia($scope.subreddit, $scope.nextCounter, $scope.gifData.after).then(function(res){
    		if(res.gifData.gifs.length) {
    			for(var i=0; i<res.gifData.gifs.length; i++) {
	    			$scope.gifData.gifs.push(res.gifData.gifs[i]);
	    		}
	    		$scope.gifData.after = res.gifData.after;
    		}
    		NProgress.done();
    		if($scope.gifData.after == null) $scope.canLoad = false;
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
			var videoData = {};
			var gifData = {};
			var videos = []; 
			var gifs = [];
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

		            videos.push(video);
		            NProgress.inc();
		            
				}

				if(post.data.domain == 'i.imgur.com') {
					var thumbUrl = post.data.thumbnail;
					var embedUrl = post.data.url + '#';
					
					var gif = {}; 
		            gif['title'] = title;
		            gif['thumbUrl'] = thumbUrl;
		            gif['embedUrl'] = embedUrl; 
		            gif['upvotes'] = upvotes;

		            gifs.push(gif);
		            NProgress.inc();
				}
			});
			//console.log(after);
			videoData['after'] = after;
			videoData['videos'] = videos;
			gifData['after'] = after;
			gifData['gifs'] = gifs;
			data['videoData'] = videoData;
			data['gifData'] = gifData;

			deferred.resolve(data);
		}, function(reason){
			deferred.reject(reason);
		});
		//console.log(deferred.promise);
		return deferred.promise;
	};

	return service;
});


