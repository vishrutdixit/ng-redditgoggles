var app = angular.module('app', []); 

app.controller('searchController', ['$scope', 'dataFactory', function($scope, dataFactory) {
    $scope.subreddit = '';
    $scope.data = {};
    $scope.videoData = {};
    $scope.gifData = {};
    $scope.nextCounter = 25; 

    $scope.canLoad = false; 

    $scope.fetchData = function(){
    	dataFactory.getAll($scope.subreddit).then(function(res){
    		$scope.data = res.data; 
    		console.log($scope.data);
    	});
    };

    $scope.fetchVideos = function(){
    	NProgress.start();
    	dataFactory.getVideos($scope.subreddit).then(function(res){
    		$scope.videoData = res; 
    		console.log($scope.videoData);
    		$scope.canLoad = true;
    		$scope.nextCounter = 25; 
    		NProgress.done();
    	})
    };

    $scope.getNext = function(){
    	NProgress.start();
    	console.log($scope.nextCounter, $scope.videoData.after)
    	dataFactory.getVideos($scope.subreddit, $scope.nextCounter, $scope.videoData.after).then(function(res){
    		for(var i=0; i<res.videos.length; i++) {
    			$scope.videoData.videos.push(res.videos[i]); 
    		}
    		$scope.videoData.after = res.after;
    		console.log($scope.videoData);
    		if($scope.videoData.after == null) 
    			$scope.canLoad = false;
    		$scope.nextCounter += 25;
    		NProgress.done();
    	})
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
			console.log(err);
		})

		return deferred.promise;}

	service.getVideos = function(subreddit, count, after) {	var deferred = $q.defer();

		service.getAll(subreddit, count, after).then(function(){
			var data = {};
			var videos = []; 
			var after = service.data.after;
			$.each(service.data.children, function(i, post){
				if(post.data.domain == 'youtube.com' || post.data.domain == 'youtu.be'){

					var title = post.data.title; 
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

		            
		            videos.push(video);
		            NProgress.inc();
		            
				}
			});
			console.log(after);
			data['after'] = after;
			data['videos'] = videos;
			deferred.resolve(data);
		}); 
		return deferred.promise;
	}

	return service;
});