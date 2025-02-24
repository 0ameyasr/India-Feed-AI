import os
import markdown2
import requests
import pytz
import time

from datetime import datetime
from agent.summarizer import Summarizer
from pymongo import MongoClient
from flask import render_template, Flask, request, jsonify

app = Flask(__name__)
mongo = MongoClient(os.getenv("MONGO_URI"))
db = mongo["IndiaFeed"]
articles = db["articles"]
videos = db["trending_videos"]
SUMMARIZER = Summarizer()
IST_TMZ = pytz.timezone("Asia/Kolkata")

NODE_SERVICE_URL = "http://localhost:7070"

@app.route("/", methods=["GET"])
def home():
    topics = ["Finance", "Politics", "Defence", "Entertainment", "Sports", "Global", "Technology", "Crime"]

    articles_by_topic = {
        topic: [
            {
                **article,
                "title": markdown2.markdown(article["title"]),
                "article": markdown2.markdown(article["article"]),
            }
            for article in reversed(list(articles.find({"topic": topic})))
            if "article" in article
        ]
        for topic in topics
    }

    trending_videos = list(videos.find({}))[-3:]
    return render_template(
        "index.html",
        topics=topics,
        articles_by_topic=articles_by_topic,
        trending_videos=trending_videos,
    )

@app.route("/api/news/<path:endpoint>", methods=["GET", "POST"])
def proxy_to_node(endpoint):
    node_url = f"{NODE_SERVICE_URL}/api/news/{endpoint}"
    
    try:
        if request.method == "POST":
            response = requests.post(node_url, json=request.json)
        else:
            response = requests.get(node_url)
        return (response.content, response.status_code, response.headers.items())

    except requests.exceptions.RequestException as e:
        return jsonify({"error": "Failed to connect to Node.js", "details": str(e)}), 500

@app.route("/processed-articles", methods=["POST"])
def get_searched_articles():
    data = request.get_json()
    summarized_articles = []
    for article in data:
        summary = SUMMARIZER.summarize(article["corpus"])
        title = SUMMARIZER.title(summary)
        current_date_ist = datetime.now(IST_TMZ)
        datetime_str = current_date_ist.strftime("%d/%m/%Y %I:%M %p")

        summarized_article_dict = {
            "title": markdown2.markdown(title),
            "article": markdown2.markdown(summary),
            "image": article["image"],
            "url": article["url"],
            "date": article["dated"],
            "added": datetime_str,
        }
        summarized_articles.append(summarized_article_dict)
        time.sleep(3)

    return jsonify(summarized_articles)