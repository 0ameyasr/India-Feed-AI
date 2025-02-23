import os

from pymongo import MongoClient
from flask import render_template, Flask, session, request
import markdown2
import requests

app = Flask(__name__)
mongo = MongoClient(os.getenv("MONGO_URI"))
db = mongo["IndiaFeed"]
articles = db["articles"]

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

if __name__ == "__main__":
    app.run(host="0.0.0.0",port=7000,debug=True)