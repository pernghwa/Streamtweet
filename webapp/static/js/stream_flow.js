(function (){
	'use strict';

	// build a dictionary checking existing tweet ids
	// assume medium dataset
	var main_tweet_dict = {};

	var linedata = {
	    labels: ["January", "February", "March", "April", "May", "June", "July"],
	    datasets: [
	        {
	            label: "Full Stream",
	            fillColor: "rgba(24, 230, 121,0)",
	            strokeColor: "rgba(22, 40, 86,1)",
	            pointColor: "rgba(220,220,220,1)",
	            pointStrokeColor: "#fff",
	            pointHighlightFill: "#fff",
	            pointHighlightStroke: "rgba(220,220,220,1)",
	            data: [65, 59, 80, 81, 56, 55, 40]
	        },
	        {
	            label: "Filtered Stream",
	            fillColor: "rgba(151,187,205,0)",
	            strokeColor: "rgba(151,187,205,1)",
	            pointColor: "rgba(151,187,205,1)",
	            pointStrokeColor: "#fff",
	            pointHighlightFill: "#fff",
	            pointHighlightStroke: "rgba(151,187,205,1)",
	            data: []
	        }
	    ]
	};
	var options = {
    ///Boolean - Whether grid lines are shown across the chart
    scaleShowGridLines : false,
    //String - Colour of the grid lines
    scaleGridLineColor : "rgba(0,0,0,.05)",
    //Number - Width of the grid lines
    scaleGridLineWidth : 1,
    //Boolean - Whether to show horizontal lines (except X axis)
    scaleShowHorizontalLines: true,
    //Boolean - Whether to show vertical lines (except Y axis)
    scaleShowVerticalLines: true,
    //Boolean - Whether the line is curved between points
    bezierCurve : true,
    //Number - Tension of the bezier curve between points
    bezierCurveTension : 0.4,
    //Boolean - Whether to show a dot for each point
    pointDot : false,
    //Number - Radius of each point dot in pixels
    pointDotRadius : 4,
    //Number - Pixel width of point dot stroke
    pointDotStrokeWidth : 1,
    //Number - amount extra to add to the radius to cater for hit detection outside the drawn point
    pointHitDetectionRadius : 20,
    //Boolean - Whether to show a stroke for datasets
    datasetStroke : true,
    //Number - Pixel width of dataset stroke
    datasetStrokeWidth : 2,
    //Boolean - Whether to fill the dataset with a colour
    datasetFill : true,
    //String - A legend template
    legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"background-color:<%=datasets[i].strokeColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>"
	};

	var ctx = $("#myChart").get(0).getContext("2d");
	var myLineChart;

	var filter_tag = {'user':[], 'text':[], 'group':[]};
	var tmp_tag = {'user':[], 'text':[], 'group':[]};
	d3.select('#rule-btn').on("click", function(){
		handleInput();
	});
	d3.select('#rule-txt').on("keydown", function(d){
		if(d3.event.keyCode==13){
			handleInput();
		}
	});
	d3.select('#play-refresh').on("click", function(){
		filter_tag = tmp_tag;
		clearPanels(true);
		redrawFigures(true);
	})

	function handleInput(){
		var input = document.querySelector("input");
		var re = /(from|text):[#A-Za-z0-9_ ]+/;
		if(input.value.match(re) == null){
			//no match patterns (from: ); (text: )
			if(input.value.indexOf('group:') > -1){
				if(input.value.substring(6).toLowerCase() in autDict_by_Org){
					tmp_tag['group'].push(input.value.substring(6).toLowerCase());
					$('select').tagsinput('add', input.value);
					$('input:text').val('');	
				}
			}
			else{
				alert('condition not matching');
				$('input:text').val('');
				return;
			}			
		}
		var index1 = tmp_tag['user'].indexOf(input.value.toLowerCase());
		var index2 = tmp_tag['text'].indexOf(input.value.toLowerCase());
		if(index1 > -1 || index2 > -1) {
			$('input:text').val('');
			return;
		}
		var a = input.value.match(/from:[A-Za-z0-9_]+/);
		if(a != null){
			tmp_tag['user'].push(a[0].substring(5).toLowerCase());
		}
		var b = input.value.match(/text:[A-Za-z0-9_ ]+/);
		if(b != null){
			tmp_tag['text'].push(b[0].substring(5).toLowerCase());
		}
		$('select').tagsinput('add', input.value);
		$('input:text').val('');	
	}

	$('select').on('beforeItemRemove', function(event) {
  	// event.item: contains the item
  	// catch change in filtering tags
	var index1 = tmp_tag['user'].indexOf(event.item.substring(5).toLowerCase());
	var index2 = tmp_tag['text'].indexOf(event.item.substring(5).toLowerCase());
	var index3 = tmp_tag['group'].indexOf(event.item.substring(6).toLowerCase());
  	if(index1 > -1){
  		tmp_tag['user'].splice(index1, 1);
  	}
  	else{
  		tmp_tag['text'].splice(index2, 1);
  	}
  	if(index3>-1){
  		tmp_tag['group'].splice(index3, 1);
  	}
  	// clear streaming page
  	//clearPanels();
});

	var maxLen = 100;
	var pointer = 0; //traverse secondary cache
	var secondaryCache = [];
	//AJAX Call to Dynamically Load Historical Tweets
	$('document').ready(function(){
		scrollalert();
	});
	function scrollalert(){
		var scrolltop=$('#main-panel1').scrollTop();
		var scrollheight=document.getElementById("main-panel1").scrollHeight;;
		var windowheight=document.getElementById("main-panel1").clientHeight;
		var scrolloffset=20;
		if(scrolltop>=(scrollheight-(windowheight+scrolloffset)))
		{
			//check the status
			var domLen = $('.atweet').length;
			if(!(state==1 || Math.max(domLen, pointer)>=Math.min(maxLen, secondaryCache.length))){
				updatestatus();
			}
		}
		setTimeout(scrollalert, 1500);
	}
	function updatestatus(){
		var partial = secondaryCache.slice(pointer, pointer+12);
		pointer += 12;
		// check for relevant tweets
		partial = partial.filter(function(d, i){
			if(filter_tag['user'].length==0 && filter_tag['text'].length==0 && filter_tag['group']==0) return true;
			for(var i=0; i<filter_tag['user'].length; i++){
				if(filter_tag['user'][i].toLowerCase() == d[2].toLowerCase()) return true;
			}
			for(var i=0; i<filter_tag['text'].length; i++){
				if(d[3].indexOf(filter_tag['text'][i])>-1) {
					return true;
				}
			}
			if(d[11] in journalistDict && filter_tag['group'].indexOf(journalistDict[d[11]])>-1){
				return true;
			}

			return false;
		});		
		console.log("ready to load more");
		d3.select('#main-panel1').append('div').attr('class', 'container').attr('id', 'wait-tweet').append('span').attr('class',"glyphicon glyphicon-refresh glyphicon-refresh-animate");
		setTimeout(function(){
		renderPanel(partial, 1, 0);
		//d3.selectAll('#wait-tweet').remove();}, 500);
		$('#wait-tweet').each(function(){$(this).remove();}),500});
	}

	var state = 1;
	var tid1, tid2, tid3;
	d3.select('#play-btn').on("click", changeState);
	function changeState(){
		if(state == 1){
			window.clearInterval(tid1);
			window.clearInterval(tid2);
			window.clearInterval(tid3);

			state = 0;
			pointer = 0;
			d3.select('#play-img-i').attr('class', function(){return "fa fa-play fa-3x";});
		}
		else{
			state = 1;
			clearPanels(false);
			tid1 = window.setInterval(refreshCache, 5000);
			tid2 = window.setInterval(cacheTweet, 1000);
			tid3 = window.setInterval(redrawFigures, 60000);
			d3.select('#play-img-i').attr('class', function(){return "fa fa-pause fa-3x";});
		}
	}

	// render zoomable time series

	// real-time panel of tweets 
	// Call to hungry.lsm:5002 every 2 sec
	// Use a cache to store tweets, replace and refresh with transition

	var cf_tweets = null; // crossfilter object that holds tweets
	var cf_dim_time = null; //time dimension
	var cf_dim_user = null; //user dimension
	var cf_dim_men = null; //mention dimension
	var cf_dim_hash = null; //hashtag dimension
	var cf_dim_id = null;

	var cf_tweettime = null; // second object for line chart
	var cf_dim_time2 = null; //time dimension
	var cf_dim_user2 = null; //user dimension
	var cf_dim_men2 = null; //mention dimension
	var cf_dim_hash2 = null; //hashtag dimension
	var cf_dim_id2 = null;

	var cf_dim_origin2 = null;

    var datacache = [];

    var journalistDict;
    d3.json("static/data/journalist_id_map.json", function(data){
    	journalistDict = data;
    });

    var autDict_by_Org;
    d3.json("static/data/autDict_by_Org.json", function(data){
    	autDict_by_Org = data;
    });


    // LOAD HISTORICAL DATA FROM LAST 24 HOURS
    // FOR DEMO ONLY
    // EXPECT JSON TWEET FILE IN GNIP FORMAT

    d3.json("static/data/data_cache.json", function(data) {
    	if(data.length == 0) return;
    	var dataarray = [];
    	for (var property in data) {
    		if (data.hasOwnProperty(property)) {
        		dataarray.push(data[property]);
    		}
		}
		processTweets(dataarray, true);
	});

	// Refresh cache every 0.5 seconds
	tid1 = window.setInterval(refreshCache, 2000);
	// Retrieve tweets every 1 second
	tid2 = window.setInterval(cacheTweet, 2000);
	// Redraw every minute
	tid3 = window.setInterval(redrawFigures, 60000);

	function drawNotify(){
 		d3.select('#overlay-tweet').transition().duration(500).style('opacity',0.8);
        setTimeout(function(){
        	d3.select('#overlay-tweet').transition().duration(500).style('opacity',0);
        },2500);
	}

	function tweetPropertyMap(GNIP_tweet){
		var hlist = GNIP_tweet[3].match(/#[A-Za-z0-9_]+/g);
		var mlist;
		if (GNIP_tweet[3].indexOf('RT')== -1){
			mlist = GNIP_tweet[3].match(/@[A-Za-z0-9_]+/g);
		}
		var out = [];
		var date = new Date(GNIP_tweet[4]);
		if(hlist){
			hlist.forEach(function(d){
				out.push({"id":GNIP_tweet[11],
					"sn":GNIP_tweet[2], 
					"tweettime":date.getTime()/1000, 
					"hashtag":d,
					"mention":''});
			});
		}
		if(mlist){
			mlist.forEach(function(d){
				out.push({"id":GNIP_tweet[11],
					"sn":GNIP_tweet[2], 
					"tweettime":date.getTime()/1000, 
					"mention":d,
					"hashtag":''});
			});
		}
		if(!mlist && !hlist){
			out.push({"id":GNIP_tweet[11],
					"sn":GNIP_tweet[2], 
					"tweettime":date.getTime()/1000,
					"mention":'',
					"hashtag":''});
		}
		return out;
	}
	function tweetPropertyMap2(GNIP_tweet){
		var hlist = GNIP_tweet[3].match(/#[A-Za-z0-9_]+/g);
		var mlist = [];
		if (GNIP_tweet[3].indexOf('RT')== -1){
			mlist = GNIP_tweet[3].match(/@[A-Za-z0-9_]+/g);
		}
		var h='',m='';
		var date = new Date(GNIP_tweet[4]);
		if(hlist){
			hlist.forEach(function(d){
				h = h+','+d;});
		}
		if(mlist){
			mlist.forEach(function(d){
				m = m+','+d;});
		}
		var source = '';
		if(GNIP_tweet[13].length>0){
			source = GNIP_tweet[13][1];
		}
		return [{"id":GNIP_tweet[11],
					"sn":GNIP_tweet[2], 
					"tweettime":date.getTime()/1000,
					"mention":m,
					"hashtag":h,
					"origin":source}];
	}

	function buildCFTable(array){
		cf_tweets = crossfilter(array);

		// create user dimension
		cf_dim_user = cf_tweets.dimension(function(d){return d.sn;});
		// create men dimension
		cf_dim_men = cf_tweets.dimension(function(d){return d.mention;});
		// create hash dimension
		cf_dim_hash = cf_tweets.dimension(function(d){return d.hashtag;});
		// create user-time join table
		cf_dim_time = cf_tweets.dimension(function(d){return d.tweettime;});

		cf_dim_id = cf_tweets.dimension(function(d){return d.id;});
	}
	function buildCFTable2(array){
		cf_tweettime = crossfilter(array);

		// create user dimension
		cf_dim_user2 = cf_tweettime.dimension(function(d){return d.sn;});
		// create men dimension
		cf_dim_men2 = cf_tweettime.dimension(function(d){return d.mention;});
		// create hash dimension
		cf_dim_hash2 = cf_tweettime.dimension(function(d){return d.hashtag;});
		// create user-time join table
		cf_dim_time2 = cf_tweettime.dimension(function(d){return d.tweettime;});
		// create source user dimension
		cf_dim_origin2 = cf_tweettime.dimension(function(d){return d.origin;});

		cf_dim_id2 = cf_tweettime.dimension(function(d){return d.id;});
	}

	var win=1, thres = 30;
	var fakec = 0;

	function processTweets(dd, cut){
			var ddtmp = dd.filter(function(d){
				var flag = parseInt(d[12]) in main_tweet_dict;
				if(!flag) main_tweet_dict[parseInt(d[12])] = 0;
				return !flag;
				});
			if(cut){
				datacache = datacache.concat(ddtmp.slice(ddtmp.length-15,ddtmp.length));
			}
			else{
				datacache = datacache.concat(ddtmp);
			}
			if(ddtmp.length > 0){

				// update secondary cache
				// always keep no more than 1,000 records
				secondaryCache = ddtmp.concat(secondaryCache);
				if(secondaryCache.length>1000){
					secondaryCache = secondaryCache.slice(0, 1000);
					pointer += datacache.length;
				}
		
				// update crossfilter table
				if(cf_tweets){
					var tmp = ddtmp.map(tweetPropertyMap);
					var outtmp = [];
					for(var i= 0; i< tmp.length; i++){
						for(var j=0; j<tmp[i].length; j++){
							outtmp.push(tmp[i][j]);
						}
					}
					cf_tweets.add(outtmp);
				}
				else{
					var tmp = ddtmp.map(tweetPropertyMap);
					var tmp1 = [];
					for(var i= 0; i< tmp.length; i++){
						for(var j=0; j<tmp[i].length; j++){
							tmp1.push(tmp[i][j]);
						}
					}
					buildCFTable(tmp1);
				}
				// update crossfilter table2 
				if(cf_tweettime){
					var tmp = ddtmp.map(tweetPropertyMap2);
					var outtmp = [];
					for(var i= 0; i< tmp.length; i++){
						for(var j=0; j<tmp[i].length; j++){
							outtmp.push(tmp[i][j]);
						}
					}
					cf_tweettime.add(outtmp);
				}
				else{
					var tmp = ddtmp.map(tweetPropertyMap2);
					var tmp1 = [];
					for(var i= 0; i< tmp.length; i++){
						for(var j=0; j<tmp[i].length; j++){
							tmp1.push(tmp[i][j]);
						}
					}
					buildCFTable2(tmp1);
				}
			}		
	}

	function cacheTweet(){

		$.post(stream_url, function(dd){
			processTweets(dd['possibles'], true);
		});
	}	
	function refreshCache(){
		var cache = datacache.slice(0, Math.min(datacache.length, 5));
		datacache = datacache.slice(cache.length, datacache.length);
		// check for relevant tweets
		cache = cache.filter(function(d, i){
			if(filter_tag['user'].length==0 && filter_tag['text'].length==0 && filter_tag['group']==0) return true;
			for(var i=0; i<filter_tag['user'].length; i++){
				if(filter_tag['user'][i].toLowerCase() == d[2].toLowerCase()) return true;
			}
			for(var i=0; i<filter_tag['text'].length; i++){
				if(d[3].indexOf(filter_tag['text'][i])>-1) {
					return true;
				}
			}
			if(d[11] in journalistDict && filter_tag['group'].indexOf(journalistDict[d[11]])>-1){
				return true;
			}

			return false;
		});
    	$.scrollLock();
    	if(cache.length>0){
    		renderPanel(cache, 1, 1);
    		setTimeout(function(){
    			update(cache.length);
    		}, 2000);
		}
	}

	function update(clen){
		$.scrollLock(false);
		if(clen == 0) return;
		setTimeout(function(){
		var prescrollPos = $('#main-panel1').scrollTop();
    		if(prescrollPos > 1000){
    			setTimeout(drawNotify(),1000);
    			var newPos = $('#main-panel1').scrollTop();  		
    		}
    		else{
     		var scrollAmount= $('#main-panel1').scrollTop();
     		$('#main-panel1').animate({scrollTop: -1*scrollAmount},1000);
     		} 
     	}, 800);    			
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
	function redrawFigures(newfig){
		newfig = typeof newfig !== 'undefined' ? newfig : false;
		// filter data according to rules
		if(filter_tag['user'].length > 0){
			cf_dim_user.filterFunction(function(d){
				return filter_tag['user'].indexOf(d.toLowerCase()) > -1;
			});
			cf_dim_user2.filterFunction(function(d){
				return filter_tag['user'].indexOf(d.toLowerCase()) > -1;
			});
		}
		else{
			cf_dim_user.filterAll();
			cf_dim_user2.filterAll();
		}
		if(filter_tag['group'].length>0){
			cf_dim_id.filterFunction(function(d){
				if(d in journalistDict)
				return filter_tag['group'].indexOf(journalistDict[d])>-1;
				return false;
			});
			cf_dim_id2.filterFunction(function(d){
				if(d in journalistDict)
				return filter_tag['group'].indexOf(journalistDict[d])>-1;
				return false;
			});
		}else{
			cf_dim_id2.filterAll();
			cf_dim_id.filterAll();
		}
		if(filter_tag['text'].length > 0){
			cf_dim_hash.filterFunction(function(d){
				return filter_tag['text'].indexOf(d.toLowerCase()) > -1;
			});
			cf_dim_hash2.filterFunction(function(d){
    			for (var j=0; j<filter_tag['text'].length; j++) {
    			    if (filter_tag['text'][j].match(d.toLowerCase())) return true;
    			}
    			return false;
			});
		}
		else{
			cf_dim_hash.filterAll();
			cf_dim_hash2.filterAll();
		}
		cf_dim_men.filterAll();
		cf_dim_men2.filterAll();
		cf_dim_time.filterAll();
		cf_dim_time2.filterAll();
		cf_dim_origin2.filterAll();
		redrawTable();
		redrawGraph(newfig);
	}

	function redrawTable(){
		// get top mentions
		var top = 12;
		var mentions = cf_dim_men.group().reduceCount().top(Infinity).filter(function(d){
			if(d['value']>0 && d['key'] != '') return true;
		}).slice(0,top);
		// get top hashtags
		var hashtags = cf_dim_hash.group().reduceCount().top(Infinity).filter(function(d){
			if(d['value']>0 && d['key'] != '') return true;
		}).slice(0,top);
		// get top prople being RTed
		var rt_people = cf_dim_origin2.group().reduceCount().top(Infinity).filter(function(d){
			if(d['value']>0 && d['key'] != '') return true;
		}).slice(0,top).map(function(d){return {'key':'@'+d['key'], 'value':d['value']};});

		renderTable(mentions, hashtags, rt_people);

		/*$.post(userinfo_url,{ 'mentions[]' : mentions.map(function(d){return d['key'];}), 'rt_people[]':rt_people.map(function(d){return d['key'];})},function(dd){
			console.log(dd['outrt_people']);
			var mentions_hyd = mentions.map(function(d,i){return {'key':d['key'], 'value':d['value'], 'info':dd['outmentions'][i]};});
			var rt_people_hyd = rt_people.map(function(d,i){return {'key':d['key'], 'value':d['value'], 'info':dd['outrt_people'][i]};});
			renderTable(mentions_hyd, hashtags, rt_people_hyd);
		});*/
	}

	function groupTime(array){
		var out = {};
		for(var i=0; i<array.length; i++){
			var secs = array[i]['tweettime'];
			var date = new Date(secs*1000.0); 
			//date.setMinutes(0,0,0);
			date.setSeconds(0,0);
			if(date.getTime() in out) out[date.getTime()] += 1;
			else out[date.getTime()] = 1;
		}
		var out1 = $.map(out, function(value, index){return {'key':index,'value':value};});
		return out1;
	}

	var rate = 1;
	var interval =20;
	var endpoint = 0;
	function redrawGraph(newfig){
		var cur_endpoint = 0;
		var tweetcount_by_hour1 =[];
		if(filter_tag['user'].length> 0 || filter_tag['text'].length>0 || filter_tag['group'].length>0){
			// get tweet counts
			tweetcount_by_hour1 = groupTime(cf_dim_time2.top(Infinity));
		}
		else{
			var series1 = [];
		}

		cf_dim_hash2.filterAll();
		cf_dim_men2.filterAll();
		cf_dim_user2.filterAll();
		cf_dim_id2.filterAll();
		var tweetcount_by_hour2 = cf_dim_time2.group(function(secs){
									var date = new Date(secs*1000.0); 
									//date.setMinutes(0,0,0); // hour as unit
									//date.setSeconds(0,0); // minute as unit
									date = new Date(date.getTime()-date.getTime()%(1000.0*rate*60)); // <rate> minutes as unit
									return date.getTime();})
									.reduceCount()
									.all();
		var series2 = tweetcount_by_hour2.map(function(d){return d['value'];});
		var series2_x = [];
		tweetcount_by_hour2.map(function(d){return d['key'];}).forEach(function(secs){
									var date = new Date(secs); 
									date.setTime(secs);
									var month = date.getMonth()+1;
									var dateStr = '';
									// AM/PM format
									/*if(date.getHours()%12 == 0){
										dateStr  =  month+'/'+date.getDate()+' ';
										if(date.getHours() == 12) dateStr += '12 PM';
										else dateStr += '12 AM';
									}
									else{
										dateStr = date.getHours()%12+' ';
										if(date.getHours()<12) dateStr+= 'AM';
										else dateStr += 'PM';
									}
									dateStr += date.getMinutes();*/
									// HH:MM format 
									dateStr += date.getHours()+':';
									if (date.getHours() < 10) dateStr  = '0'+dateStr;
									if (date.getMinutes() < 10) dateStr += '0'+date.getMinutes();
									else dateStr += date.getMinutes();
									series2_x.push(dateStr);
									cur_endpoint = Math.max(endpoint, secs);
								});
		var array = series2_x;

		// TODO: NEEDS FIX
		// BUG: only maps to all indexes that series 2 appears in 
		// the graph assumes journalists posting all the time
		var series1 = [];

		tweetcount_by_hour2.forEach(function(d){
			for(var i=0; i<tweetcount_by_hour1.length; i++){
				if(d['key']==tweetcount_by_hour1[i]['key']){
					series1.push(tweetcount_by_hour1[i]['value']);
					return;
				}
			}
			series1.push(0);
		});

		if((cur_endpoint-endpoint)>(1000.0*rate*60)){
			newfig=true;
		}
		endpoint = cur_endpoint;

		if(myLineChart===undefined || newfig){
			linedata.labels = array;
			linedata.datasets[0].data = series2;
			if(series1.length>0){
				linedata.datasets[1].data = series1;
			}
			else{
				var vec = series2.map(function(){return 0;});
				linedata.datasets[1].data = vec;
			}
			if(series2.length>interval){
				linedata.datasets[0].data = series2.slice(series2.length-interval, series2.length);
				var len1 = series1.length;
				linedata.datasets[1].data = series1.slice(len1-interval, len1);
				linedata.labels = array.slice(array.length-interval, array.length);
			}
			myLineChart = new Chart(ctx).Line(linedata, options);
			legend(document.getElementById('placeholder'), linedata);
		}
		else{
			// ASSERT INCREMENTAL CHANGE: array.length-linedata.labels.length <2
			var myLabels = myLineChart.scale.xLabels;
			if(myLabels.length < array.length && array[array.length-1] != myLabels[myLabels.length-1]){
				if(array.length > interval){
					myLineChart.removeData();
				}
				if(series1.length>0){
					myLineChart.addData([series2[series2.length-1],series1[series2.length-1]], array[array.length-1]);
				}
				else{
					myLineChart.addData([series2[series2.length-1],0], array[array.length-1]);
				}
				//TODO: need to handle older data by removing them
			}
			else{
				if(series1.length>0){
					myLineChart.datasets[1].points[myLineChart.datasets[1].points.length-1].value = series1[series2.length-1];
				}
				myLineChart.datasets[0].points[myLineChart.datasets[0].points.length-1].value = series2[series2.length-1];
			}
			myLineChart.update();
		}
	}


	function clearPanels(flag){

		// reset secondary cache pointer index
		pointer = 0;

		datacache = [];

		for(var ii=1; ii<win+1; ii++){
			var panel = d3.select('#main-panel'+ii);
			var paneldiv = panel.selectAll('span.atweet');
			var mediadiv = panel.selectAll('.media');
			if(!paneldiv.empty()){
				mediadiv.transition()
						.duration(function(d,i){return 40;})
						.each("end", function(){
							//d3.select(this).remove();
							$(this).remove();
						});
				paneldiv.transition()
						.duration(function(d,i){return 40;})
						.each("end", function(){
							//d3.select(this).remove();
							$(this).remove()
						});
			}
			var upanel = d3.select('#user-desc');
			var userdiv = upanel.selectAll('div');
			if(!userdiv.empty()){
				userdiv.transition()
						.duration(function(){return 40;})
						.each("end", function(){
							//d3.select(this).remove();
							$(this).remove()
						});
			}
		}

		// clear table 
		if(flag){
			$("tr.table-row").remove();
		}

		// clear linechart
	}
	var wid = 0;

	function renderPanel(cache, pid, front){
	var start = wid;
	var panel = d3.select('#main-panel'+pid);
  	var paneldiv = panel.selectAll('.media').filter(function(d, i){return i>=thres;});//panel.selectAll('div.atweet').size()-i>thres;});

	var removenum = 0;
 	if(!paneldiv.empty()){
 	paneldiv.transition()
 		.style('top', function(d, i){return 600*(i+1)+"px";})
 		.duration(function(d,i){return 80*(i+1);})
		.each("end",function() { 
			removenum += 1;
		    //d3.select(this).       // so far, as above
		      $(this).remove();            // we delete the object instead 
		   });
	pointer -=removenum;
	}
	var tweet_panel = document.getElementById('main-panel1');

	cache.forEach(function(dd){
 		var org = 'default';
 		var actor = dd[13];
 		var author = dd[2];
 		var author_id = dd[11];
 		$.getJSON("https://api.twitter.com/1/statuses/oembed.json?id="+dd[12]+"&align=left&maxwidth=550&hide_media=true&callback=?",
                function(data){
                	
					if (author_id in journalistDict)
						{org = journalistDict[author_id];}

                    var span = document.createElement("span");
                    $(span).html(data.html);

                    $(span).attr('class', 'atweet');
                    var media = document.createElement("div");
                    $(media).attr('class','media '+org);

                    var media_left = document.createElement("div");
                    $(media_left).attr('class', 'media-left');
                    $(media_left).append("<img class='media-object img-rounded' src='static/images/"+org+".png' width='150px' alt='Media Object'>")

                    var media_body = document.createElement("div");
                    $(media_body).attr('class', 'media-body');

                    if(actor.length>0){
                    	$(media_body).append("<div class='retweet'><img class='img-rounded' float='left' style='margin-right:0' src='static/images/retweet.png' width='20px' height='20px' alt='Media Object'>"+"<span style='padding-left:10px;'><font face='sans-serif' color='#abb7c0' size='2'><a font-color='#abb7c0' href='https://twitter.com/"+ author + "''>"+ author +"</a> retweeted</font>"+"</span></div>");}

                    $(media_body).append(span);
                    $(media).append(media_left).append(media_body);
                    
                	wid += 1;
                	if(front){
                	$('#overlay-tweet')
        				.after($(media).hide()
        				.css('opacity',0.0).slideDown('slow')
        				.animate({opacity: 1.0}));
        			}
        			else{
                	$(media)
        				.hide()
        				.css('opacity',0.0)
        				.appendTo('#main-panel1')
        				.slideDown('slow')
        				.animate({opacity: 1.0});
        			}
                	
                }).fail( function(d, textStatus, error) {
        console.error("getJSON failed, status: " + textStatus + ", error: "+error)
    	});
       });
    }

    function renderTable(mentions, hashtags, rtusers){
		$("tr.table-row").remove();      

        setTimeout(function(){
        	
        	var tr = d3.select("#mention-table").selectAll("tr.table-row")
        		.data(mentions)
        		.enter()
        		.append("tr")
        		.attr("class", "table-row mention");

        		$('tr.table-row.mention')
        	        .hide()
        			.css('opacity',0.0)
        			.slideDown('slow')
        			.animate({opacity: 1.0});
		
        		renderTableDetails(tr,"https://twitter.com/");

        	var tr = d3.select("#rtuser-table").selectAll("tr.table-row")
        		.data(rtusers)
        		.enter()
        		.append("tr")
        		.attr("class", "table-row rtuser");

        		$('tr.table-row.rtuser')
        	        .hide()
        			.css('opacity',0.0)
        			.slideDown('slow')
        			.animate({opacity: 1.0});
		
        		renderTableDetails(tr,"https://twitter.com/");
	
        	var tr = d3.select("#hashtag-table").selectAll("tr.table-row")
        		.data(hashtags)
        		.enter()
        		.append("tr")
        		.attr("class", "table-row hashtag");

        		$('tr.table-row.hashtag')
        	        .hide()
        			.css('opacity',0.0)
        			.slideDown('slow')
        			.animate({opacity: 1.0});
		
        		renderTableDetails(tr,'https://twitter.com/search?q=%23');

        	},30);
    }

    function renderTableDetails(tr, url){
        var columns = ['key', 'value'];
        tr.selectAll("td")
          .data(function(d) {return columns.map(function(k) { return {column:k, value:d[k]}; }); })
            .enter().append("td")
            .attr('class',function(d,i){return 'col_'+i;})
            .text(function(d, i) {if (i>=1) {return d.value;} })
            .transition()
            .duration(function(d,i){return 40*i;});

        //var ud = tr.selectAll("td.col_0")
        //	 .append('div').attr('class', 'media usermedia');
        tr.selectAll("td.col_0")
          .data(function(d) {return columns.slice(0,1).map(function(k){return {column:k, value:d[k]};});})
          .insert('a')
          .attr('href', function(d){return url+d.value.substring(1);})
          .text(function(d){return d.value});

        /*var udmedia = ud.append('div').attr('class', 'media-left');
		udmedia.append('img').attr('class', 'media-object img-rounded')
			.attr("src",function(d) {
							console.log(d);
							 if(d.value.length > 0 )
			                 return d.value[0].replace('normal', '400x400');
			             	 else
			             	 return 'static/images/default.png';
			           }).attr("width", "40px").attr("height", "40px").attr("alt","Media Object");   
		ud.append('div').attr('class','media-body')
			.append('p').attr('class','user-header')
			.text(function(d){return d.value[1]+"  "+"@";})
			.append('p').attr('class','text-body')
			.text(function(d){return d.value[2].replace('\n','').replace('\r','').substring(0,110)+"...";})
			.append('p').attr('class','endline')
			.text(function(d){return d.value[3]+" TWEETS, "+d.value[4]+" FOLLOWING, "+d.value[5]+" FOLLOWERS";});*/	    

        tr.selectAll("td.col_1")
          .data(function(d) {return columns.slice(0,1).map(function(k){return {column:k, value:d[k]};});})
          .insert('img')
          .attr('class', 'table_tweet')
          .attr('src', function(d){return "static/images/twitter.png";})
          .attr('border', 1)
          .attr('height', 18)
          .attr('width', 20)
          .attr('alt',"");    
    }

    function showUser(user){
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
    }

var step = 50;
var scrolling = false;

// Wire up events for the 'scrollUp' link:
$("#scrollUp").bind("click", function(event) {
    event.preventDefault();
    // Animates the scrollTop property by the specified
    // step.
    $("#main-panel1").animate({
        scrollTop: "-=" + step + "px"
    });
}).bind("mouseover", function(event) {
    scrolling = true;
    scrollContent("up");
}).bind("mouseout", function(event) {
    scrolling = false;
});


$("#scrollDown").bind("click", function(event) {
    event.preventDefault();
    $("#main-panel1").animate({
        scrollTop: "+=" + step + "px"
    });
}).bind("mouseover", function(event) {
    scrolling = true;
    scrollContent("down");
}).bind("mouseout", function(event) {
    scrolling = false;
});

function scrollContent(direction) {
    var amount = (direction === "up" ? "-=17px" : "+=17px");
    $("#main-panel1").animate({
        scrollTop: amount
    }, 1, function() {
        if (scrolling) {
            scrollContent(direction);
        }
    });
}

    function parseTime(timeStr){
    	return timeStr.replace('T',' ').replace('.000Z','');
    }

function legend(parent, data) {
    parent.className = 'legend';
    var datas = data.hasOwnProperty('datasets') ? data.datasets : data;

    // remove possible children of the parent
    while(parent.hasChildNodes()) {
        parent.removeChild(parent.lastChild);
    }

    datas.forEach(function(d) {
        var title = document.createElement('span');
        title.className = 'title';
        parent.appendChild(title);

        var colorSample = document.createElement('div');
        colorSample.className = 'color-sample';
        colorSample.style.backgroundColor = d.hasOwnProperty('strokeColor') ? d.strokeColor : d.color;
        colorSample.style.borderColor = d.hasOwnProperty('fillColor') ? d.fillColor : d.color;
        title.appendChild(colorSample);

        var text = document.createTextNode(d.label);
        title.appendChild(text);
    });
}

var slide_state=0, slide_num=3;
d3.select('#slide-right').on("click", function(){
	if(slide_state>=slide_num-1) return;
	console.log("move right");
	slideTable(true, slide_state);
	slide_state+= 1;
});
d3.select('#slide-left').on("click", function(){
	if(slide_state==0)return;
	slideTable(false, slide_state);
	slide_state-=1;
});

function slideTable(toRight, idx){
	d3.select('#tables').attr('overflow', 'auto');
	d3.select('div.ranking').attr('overflow', 'auto');
	if(toRight){
		$('div.horizontal').animate({scrollLeft: 518*(idx+1)},1000);
	}
	else{
		$('div.horizontal').animate({scrollLeft: 518*(idx-1)},1000);
	}

	d3.select('#tables').attr('overflow', 'hidden');
	d3.select('div.ranking').attr('overflow', 'hidden');
}

})();
