from agent.summarizer import Summarizer
from apscheduler.schedulers.blocking import BlockingScheduler
from pymongo import MongoClient
from datetime import datetime

import os
import pytz
import requests
import time

MONGO_CLIENT = MongoClient(os.getenv("MONGO_URI"))
DB = MONGO_CLIENT["IndiaFeed"]
IST_TMZ = pytz.timezone("Asia/Kolkata")
WEBSCRAPER_API_URL = os.getenv("WEBSCRAPER_API_URL")
SUMMARIZER = Summarizer()

def get_scraped_articles(topic:str):
    payload = {
        "topic": topic,
        "requestId": 123456789,
    }
    response = requests.post(WEBSCRAPER_API_URL,json=payload)

    if response.status_code == 200:
        return list(response.json()['articles'])
    else:
        print(f"There was an error fetching the scraped articles for {topic}")
        return None

def get_summarized_articles(articles:list,topic:str) -> list[dict]:
    summarized_articles = []
    for article in articles:
        summary = SUMMARIZER.summarize(article["corpus"])
        title = SUMMARIZER.title(summary)

        current_date_ist = datetime.now(IST_TMZ)
        datetime_str = current_date_ist.strftime("%d/%m/%Y %I:%M %p")

        summarized_article_dict = {
            "title": title,
            "article": summary,
            "image": article["image"],
            "url": article["url"],
            "date": article["dated"],
            "topic": topic.capitalize(),
            "added": datetime_str,
        }      

        summarized_articles.append(summarized_article_dict)
        time.sleep(10)
    return summarized_articles

def populate_articles(topic:str):
    try:
        print(f"Fetching articles for topic '{topic}'")

        to_summarize = []
        articles_db = DB["articles"]
        article_objects = get_scraped_articles(topic)
        for article_object in article_objects:
            existing_article = articles_db.find_one({"url":article_object["url"]})
            if existing_article:
                print(f"Refusing to summarize article {article_object['url']} since it exists")
                continue
            else:
                to_summarize.append(article_object)

        print(f"Scraped related articles for the {topic}, beginning summarization job")
        if to_summarize:
            summarized_article_objects = get_summarized_articles(to_summarize,topic)
            current_time = datetime.now(IST_TMZ)
            count = 0

            for article_object in summarized_article_objects:
                articles_db.insert_one(article_object)
                print(f'Submitted article summary context from {article_object["url"]}')
                count += 1

            print(f"Submitted {count} articles @ IST {current_time} for topic {topic}")
        else:
            print(f"Did not push anything, since there was nothing to summarize on topic {topic}")

    except Exception as error:
        print(f"Error: {error}")

def populate_across_all_topics():
    print(f"Populating articles across all topics @ IST {datetime.now(IST_TMZ)}")
    topics = [
        "finance",
        "politics",
        "defence",
        "entertainment",
        "sports",
        "global",
        "technology",
        "crime",
    ]
    for topic in topics:
        print(f"Beginning population for '{topic}'")
        populate_articles(topic)
        print(f"Server cooldown for 10 seconds")
        time.sleep(10)
    print(f"Finished database population for all topics")
    
if __name__ == "__main__":
    scheduler = BlockingScheduler()
    scheduler.add_job(func=populate_across_all_topics,
                      trigger='cron',
                      hour='3,6,10,12,14,16,18,20,22,0',
                      minute='1',
                      name="Populating articles")

    print(f"Started process_scheduler @ IST {datetime.now(IST_TMZ)}")
    try:
        scheduler.start()
    except KeyboardInterrupt:
        print(f"Scheduler interrupted.")
    except Exception as error:
        print(f"An error occured while running jobs: \n{error}")