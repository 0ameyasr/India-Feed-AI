const puppeteer = require('puppeteer');
const News = require('../models/newsModel');
class WebScrapingService {
    constructor() {
        this.News = News;
    }

    async scrapeNews(topic) {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

        const searchUrl = `https://www.indiatoday.in/search/${encodeURIComponent(topic)}`;
        console.log('Fetching:', searchUrl);
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });

        await page.waitForSelector('#more_content_container');

        // Extract article links (TOP 3)
        const articleLinks = await page.evaluate(() => {
            const container = document.querySelector('#more_content_container');
            return container
                ? Array.from(container.querySelectorAll('a.grid_card_link')).map(a => a.href).slice(0, 3)
                : [];
        });

        await browser.close();

        // Call the internal function to scrape article details
        const articles = await this.scrapeTopArticles(articleLinks);
        return articles;
    }

    async scrapeArticleDetails(page, articleUrl) {
        await page.goto(articleUrl, { waitUntil: 'networkidle2' });

        const articleData = await page.evaluate(() => {
            const titleElement = document.querySelector('h1[class^="Story_strytitle"]');
            const kickerElement = document.querySelector('div.story-kicker h2');
            const imageElement = document.querySelector('img[src^="https://akm-img-a-in.tosshub.com/indiatoday/images/story/"]');
            const paragraphElements = document.querySelectorAll('p');

            return {
                title: titleElement ? titleElement.innerText.trim() : 'No title',
                storyKicker: kickerElement ? kickerElement.innerText.trim() : 'No story kicker',
                image: imageElement ? imageElement.src : 'No image',
                corpus: Array.from(paragraphElements).map(p => p.innerText.trim()).join(' ')
            };
        });

        return articleData;
    }

    async scrapeTopArticles(articleLinks) {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

        const articles = [];
        for (const link of articleLinks) {
            try {
                console.log(`Fetching article: ${link}`);
                const articleData = await this.scrapeArticleDetails(page, link);
                articles.push(articleData);
            } catch (error) {
                console.error(`Error scraping article ${link}:`, error);
            }
        }

        await browser.close();
        console.log("Final Articles Array:", articles); // Debugging log
        return articles;
    }
}

module.exports = WebScrapingService;