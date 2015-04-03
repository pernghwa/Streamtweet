from flask import render_template, url_for, jsonify
from webapp import app
import pycurl
import json
import sys
import threading
import datetime

@app.route('/')
@app.route('/index')
@app.route('/main')
def index():
	return render_template("index.html")

@app.route('/stream_flow.html')
def stream():
	url_for('static', filename='data/febTweets.json')
	return render_template("stream_flow.html")

buff = ""
tweetCache = []

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

def stream_callback(data):
    global buff	
    global tweetCache
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
			time = datetime.datetime.strptime(j['postedTime'], '%Y-%m-%d %H:%M:%S')
			time = time-datetime.timedelta(hours = 4)
			print time
			possibles.append([j['actor']['image'], j['actor']['displayName'], j['actor']['preferredUsername'], j['body'], time, j['retweetCount'], j['favoritesCount'], j['actor']['followersCount'], j['actor']['friendsCount'], j['actor']['statusesCount'] ,j['actor']['summary'], j['actor']['id'].split(':')[2]])
		except:
			print "exception!", t
	tweetCache.extend(possibles)

@app.route('/get_stream_data/', methods = ['POST'])
def get_stream_data():
	global tweetCache
	possibles = [t for t in tweetCache]
	tweetCache = []
	return jsonify(possibles = possibles)

t = threading.Thread(target=worker)
t.start()
