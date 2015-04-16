import os
from flask import Flask
from config import *
import tweepy

basedir = os.getcwd()
app = Flask(__name__)

USER_KEY = "secret"
USER_SECRET = "secret"
USER_TOKEN = "secret"
USER_TOKEN_SECRET = "secret"
CONSUMER_KEY = "secret"
CONSUMER_SECRET = "secret"
ACCESS_TOKEN = "secret"
ACCESS_TOKEN_SECRET = "secret"

auth = tweepy.AppAuthHandler(CONSUMER_KEY, CONSUMER_SECRET)
twitter_api = tweepy.API(auth)

