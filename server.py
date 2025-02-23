import os

from pymongo import MongoClient
from flask import render_template, Flask, session, request
import markdown2

app = Flask(__name__)
mongo = MongoClient(os.getenv("MONGO_URI"))
db = mongo["IndiaFeed"]
articles = db["articles"]

@app.route("/",methods=["GET"])
def home():
    topics = ["Finance", "Politics", "Defence", "Entertainment", "Sports", "Global", "Technology", "Crime"]

    articles_by_topic = {}
    for topic in topics:
        topic_articles = list(articles.find({"topic": topic}))
        for article in topic_articles:
            if 'article' in article:
                article['title'] =  markdown2.markdown(article["title"])
                article['article'] = markdown2.markdown(article['article'])
        articles_by_topic[topic] = topic_articles

    return render_template(
        "index.html",
        topics=topics,
        articles_by_topic=articles_by_topic,
    )

if __name__ == "__main__":
    app.run(host="0.0.0.0",port=7000,debug=True)