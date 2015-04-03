(function (){
	'use strict';
	var tag = "nyc_explode";//"jmap"
	var gnip_url = "localhost://0.0.0.0:5004/stream/"+tag;

	var state = 1;
	var tid1, tid2;
	d3.select('#play-btn').on("click", changeState);
	function changeState(){
		if(state == 1){
			window.clearInterval(tid1);
			window.clearInterval(tid2);
			state = 0;
			d3.select('#play-img').attr('class', function(){return "glyphicon glyphicon-play";});
		}
		else{
			state = 1;
			clearPanels();
			tid1 = window.setInterval(refreshCache, 500);
			tid2 = window.setInterval(cacheTweet, 1000);
			d3.select('#play-img').attr('class', function(){return "glyphicon glyphicon-pause";});
		}
	}

	// render zoomable time series

	// real-time panel of tweets 
	// Call to hungry.lsm:5002 every 2 sec
	// Use a cache to store tweets, replace and refresh with transition

    var datacache = [];

    var autDict;
    d3.json("static/data/autDict.json", function(data){
    	autDict = data;
    })

    d3.json("static/data/febTweets.json", function(data) {
    	var partition = generatePartition(datacache.slice(0,5).length, 3);
    	console.log(partition);
    	renderPanel(datacache.slice(0,5).filter(function(d, i){return partition[i]===0;}), 1);
    	renderPanel(datacache.slice(0,5).filter(function(d, i){return partition[i]===1;}), 2);
    	//renderPanel(datacache.slice(0,5).filter(function(d, i){return partition[i]===2;}), 3);	
 	});

	// Refresh cache every 0.5 seconds
	tid1 = window.setInterval(refreshCache, 500);
	// Retrieve tweets every 1 second
	tid2 = window.setInterval(cacheTweet, 1000);

	var win=2, thres = 7;
	
	function cacheTweet(){
		$.post(stream_url, function(dd){
			datacache = datacache.concat(dd['possibles']);
		});
	}
	function refreshCache(){
		var cache = datacache.slice(0, Math.min(datacache.length, 24));
		datacache = datacache.slice(cache.length, datacache.length);
    	var partition = generatePartition(cache.length, win);
    	renderPanel(cache.filter(function(d, i){return partition[i]===0;}), 1);
    	renderPanel(cache.filter(function(d, i){return partition[i]===1;}), 2);
    	//renderPanel(cache.filter(function(d, i){return partition[i]===2;}), 3);
	}

	function generatePartition(arraylen, partnum){
		var tmp = shuffle(Array.apply(null, Array(arraylen)).map(function (_, i) {return i;}));
		var partition = {};
		var block = arraylen/partnum;
		var flip = Math.floor(Math.random()*2);
		if(flip == 1){
		for(var i=0; i<tmp.length; i++){
			partition[tmp[i]] = Math.floor(i/block);
		}}
		else{
		for(var i=0; i<tmp.length; i++){
			partition[tmp[i]] = partnum-Math.floor(i/block);
		}			
		}
		return partition;
	}

	function shuffle(array){
		var currentIndex = array.length, temporaryValue, randomIndex ;
		while (0 !== currentIndex) {
		  randomIndex = Math.floor(Math.random() * currentIndex);
		  currentIndex -= 1;
		  temporaryValue = array[currentIndex];
		  array[currentIndex] = array[randomIndex];
		  array[randomIndex] = temporaryValue;
		}
		return array;
	}

	function clearPanels(){
		for(var ii=1; ii<win+1; ii++){
			var panel = d3.select('#main-panel'+ii);
			var paneldiv = panel.selectAll('div.atweet');
			if(!paneldiv.empty()){
				paneldiv.transition()
						.duration(function(d,i){return 40*(i+1);})
						.each("end", function(){
							d3.select(this).remove();
						});
			}
			var upanel = d3.select('#user-desc');
			var userdiv = upanel.selectAll('div');
			if(!userdiv.empty()){
				userdiv.transition()
						.duration(function(){return 40;})
						.each("end", function(){
							d3.select(this).remove();
						});
			}
		}
	}

	function renderPanel(cache, pid){
	var panel = d3.select('#main-panel'+pid);
  	var paneldiv = panel.selectAll('div.atweet').filter(function(d, i){return i>=thres;});//panel.selectAll('div.atweet').size()-i>thres;});

 	if(!paneldiv.empty()){
 	paneldiv.transition()
 		.style('top', function(d, i){return 600*(i+1)+"px";})
 		.duration(function(d,i){return 80*(i+1);})
		.each("end",function() { 
		    d3.select(this).       // so far, as above
		      remove();            // we delete the object instead 
		   });}

 	var tweet = panel.selectAll('atweet')
 				.data(cache)
 				.enter()
 				.insert('div',':first-child')
 				.attr('class', function(d){
 					if (!(parseInt(d[11]) in autDict)) return 'atweet thumbnail media col-md-4';
 					return 'atweet thumbnail media col-md-4 '+'block'+autDict[parseInt(d[11])];
 				})
 				.style('opacity', 0)
				.on('mouseover', function(d){
					var ud = d3.select('#user-desc');
					ud.selectAll('div').remove();
					var udmedia = ud.append('div').attr('class', 'media-left');
					udmedia.append('img').attr('class', 'media-object img-rounded')
						.attr("src",function() {
				                    return d[0].replace('normal', '400x400');
				              }).attr("width", "40px").attr("alt","Media Object");
					ud.append('div').attr('class','media-body')
						.append('p').attr('class','user-header')
						.text(function(){return d[1]+"  "+"@"+d[2];})
						.append('p').attr('class','text-body')
						.text(function(){return d[10].replace('\n','').replace('\r','').substring(0,110)+"...";})
						.append('p').attr('class','endline')
						.text(function(){return d[7]+" followers, "+d[8]+" friends, "+d[9]+" statuses";});
				});
 				
 	var media = tweet.append('div')
 					.attr('class', 'media-left');

 	media.append('img')
 		.attr('class', 'media-object img-rounded')
 		.attr("src",function(d) {
                    return d[0].replace('normal', '400x400');
              }).attr("width", "60px").attr("alt","Media Object");

 	var media_body = tweet.append('div')
 		.attr('class', 'media-body');

 	media_body.append('p')
 		.attr('class', 'user-header')
 		.append('b')
 		.text(function(d, i){return d[1]+"   " + "@"+d[2];});

 	media_body.append('p')
 		.attr('class', 'text-body')
 		.text(function(d){return d[3];});

 	media_body.append('p')
 		.attr('class', 'endline')
 		.text(function(d){return parseTime(d[4])+"  ";})
 		.append('b')
 		.text(function(d){return "Retweets:"+d[5]+" Favorites:"+d[6];});

    tweet.transition()
        .delay(function(d, i){return 200*(i+1);})
	    .style("opacity", 1);
    }

    function parseTime(timeStr){
    	return timeStr.replace('T',' ').replace('.000Z','');
    }
})();
