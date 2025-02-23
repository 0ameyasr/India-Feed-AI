import os
import markdown2
import requests
import pytz 
import time

from datetime import datetime
from agent.summarizer import Summarizer
from pymongo import MongoClient
from flask import render_template, Flask, session, request, jsonify

app = Flask(__name__)
mongo = MongoClient(os.getenv("MONGO_URI"))
db = mongo["IndiaFeed"]
articles = db["articles"]
SUMMARIZER = Summarizer()
IST_TMZ = pytz.timezone("Asia/Kolkata")

@app.route("/",methods=["GET"])
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

    # trending_videos = []
    # try:
    #     response = requests.get("http://localhost:5000/api/news/trending-videos")
    #     if response.status_code == 200:
    #         trending_videos = response.json()
    # except requests.exceptions.RequestException as e:
    #     print(f"Error fetching trending videos: {e}")

    return render_template(
        "index.html",
        topics=topics,
        articles_by_topic=articles_by_topic,
    )

@app.route("/fetch-news", methods=["POST"])
def get_news_content():
    data = request.get_json()
    topic = data.get("topic", "")
    
    if not topic:
        return jsonify({"error": "No topic provided"}), 400

    return jsonify({"message": f"Fetching news for {topic}"})

@app.route("/processed-articles",methods=["POST"])
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

if __name__ == "__main__":
    app.run(host="0.0.0.0",port=7000,debug=True)