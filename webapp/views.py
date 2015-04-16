from flask import render_template, url_for, jsonify,request
from webapp import app, twitter_api
import pycurl
import json
import sys
import re
import threading
import datetime, time
import os

@app.route('/')
@app.route('/index')
@app.route('/main')
def index():
	return render_template("index.html")

@app.route('/stream_flow.html')
@app.route('/stream_flow/')
def stream():
	#url_for('static', filename='data/febTweets.json')
	return render_template("stream_flow.html")

@app.route('/timeline.html')
@app.route('/timeline/')
def timeline():
	#url_for('static', filename='data/febTweets.json')
	return render_template("timeline.html")


buff = ""
tweetCache = []
userCache = {}
out = []
hour = datetime.datetime.today().hour

def worker():
	conn = pycurl.Curl()
	conn.setopt(pycurl.URL, "0.0.0.0:5004/stream/" + sys.argv[1])
	conn.setopt(pycurl.WRITEFUNCTION, stream_callback)
	
	while True:
	    #print "Connecting"
	    try:
	        conn.perform()
	    except:
	        pass

def hydrateUsers(users):
	global userCache

	for u in users:
		if u in userCache and len(userCache[u])>0:
			continue
		try:
			them = twitter_api.lookup_users(screen_names=[u])[0]
		except Exception as e:
			print e
			userCache[u] = []
			continue
		#print "processing user, "+u

		if them.protected:
			# get default data by setting to none
			userCache[u] = []
			continue

		userCache[u]=[them.profile_background_image_url, them.name, them.description, them.statuses_count, them.friends_count, them.followers_count]

		#print userCache[u]

def stream_callback(data):
    global buff	
    global tweetCache
    global out
    possibles = []
    if isinstance(data,basestring) and len(data.strip()) > 0:
	buff += data
        try:
            [tww,remainder] = buff.rsplit("\n",1)
        except:
            return
	buff = remainder
	for t in tww.split("\n"):	
		if t.strip() == "1" or len(t.strip()) == 0:
			continue
		try:
			j = json.loads(t)
			#print j['body']
			tweettime = datetime.datetime.strptime(j['postedTime'], '%Y-%m-%dT%H:%M:%S.000Z')
			tweettime = tweettime-datetime.timedelta(hours = 4)
			seconds = time.mktime(tweettime.timetuple())*1000
			actor = []
			if j['verb'] == 'share':
				actor.extend([j['object']['actor']['id'].split(':')[2], j['object']['actor']['preferredUsername'], j['object']['actor']['image']])
				# process RTed users
				#if not j['object']['actor']['preferredUsername'] in userCache:
				#	userCache[j['object']['actor']['preferredUsername']] = [[ j['object']['actor']['image'], j['object']['displayName'], j['object']['summary'],j['object']['statusesCount'], j['object']['friendsCount'], j['object']['followersCount']]]
			# process mentioned users

			#tmpUserCache = re.findall('@([A-Za-z0-9_]+)', j['body'])
			#hydrateUsers(tmpUserCache)

			possibles.append([j['actor']['image'], j['actor']['displayName'], j['actor']['preferredUsername'], j['body'], seconds, j['retweetCount'], j['favoritesCount'], j['actor']['followersCount'], j['actor']['friendsCount'], j['actor']['statusesCount'] ,j['actor']['summary'], j['actor']['id'].split(':')[2], j['id'].split(':')[2], actor])
		except:
			print "exception!", t
	tweetCache.extend(possibles)
	out.extend(possibles)
	print len(out)
'''
@app.route('/feed_query_result/', methods=['POST'])
def feed_query_result():
	global hour

	time = datetime.datetime.today()

	user_rules = [x for x in request.form.getlist('users[]')]
	tag_rules = [x for x in request.form.getlist('texts[]')]

	# check the current cached data for search
	# data structure: assume the following tables
	# user_handle, t_written_time
	# hashtag, t_written_time

	# construct count vector
	shour = hour + 1
	count = []
	bdelta = datetime.timedelta(days=0, hours=24)
	sdelta = datetime.timedelta(days=0, hours=2)
	time = time-bdelta
	for i in range(24):
		time1 = time+sdelta
		for u in user_rules:
			tmp += db.session.query(user).filter_by(user.t_written_time > time && user.t_written_time <= time1 && user.user_handle == u).count()
		for h in tag_rules:
			tmp += db.session.query(user).filter_by(hashtag.t_written_time > time && hashtag.t_written_time <= time1 && hashtag.hashtag == h).count()
		time1 = time
		count.append(tmp)
	return jsonify(countvec=count)
'''
@app.route('/get_stream_data/', methods = ['POST'])
def get_stream_data():
	global tweetCache
	possibles = [t for t in tweetCache[:min(15, len(tweetCache))]]
	tweetCache = tweetCache[min(15, len(tweetCache)):]
	return jsonify(possibles = possibles)

def save_cache_data():
	global out
	print os.getcwd(), len(out)
	with open(os.getcwd()+'/webapp/static/data/data_cache.json', 'r') as data_file:
		data = json.load(data_file)
	for rec in out:
		data[rec[12]] = rec
	with open(os.getcwd()+'/webapp/static/data/data_cache.json', 'w') as out_file:
		json.dump(data, out_file)
	out = []
	threading.Timer(10, save_cache_data).start()

@app.route('/get_user_info/', methods = ['POST'])
def get_user_info():
	global userCache

	mentions = [x for x in request.form.getlist('mentions[]')]
	outmentions = []
	for u in mentions:
		tmp = u[1:]
		print 'user',u
		if tmp in userCache:			
			outmentions.append(userCache[tmp])
		else:
			print 'not in cache'
			hydrateUsers([tmp])
			if not tmp in userCache:
				outmentions.append([])
			else:
				outmentions.append(userCache[tmp])
	rt_people = [x for x in request.form.getlist('rt_people[]')]
	outrt_people = []
	for u in rt_people:
		print 'user',u
		if u in userCache:
			outrt_people.append(userCache[u])
		else:
			print 'not in cache'
			hydrateUsers([u])
			if not u in userCache:
				outrt_people.append([])
			else:
				outrt_people.append(userCache[u])
	print outmentions
	print outrt_people
	return jsonify(outmentions=outmentions, outrt_people = outrt_people)

save_cache_data()
t = threading.Thread(target=worker)
t.start()
