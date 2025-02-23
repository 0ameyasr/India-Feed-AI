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

        const formattedTopic = topic.toLowerCase().replace(/\s+/g, "-"); 
        const searchUrl = `https://www.indiatoday.in/search/${formattedTopic}&ctype=story`;
        console.log('Fetching:', searchUrl);
        
        await page.goto(searchUrl, { waitUntil: 'networkidle2' });
        await page.waitForSelector('#more_content_container');

        const articleLinks = await page.evaluate(() => {
            const container = document.querySelector('#more_content_container');
            return container
                ? Array.from(container.querySelectorAll('a.grid_card_link'))
                    .map(a => a.href)
                    .filter(link => 
                        link.startsWith('https://www.indiatoday.in') && 
                        !link.includes('/visualstories/') &&            
                        !link.includes('/magazine/')                    
                    )                    
                    .slice(0, 5)
                : [];
        });
        
        await browser.close();

        const articles = await this.scrapeTopArticles(articleLinks);
        
        const validArticles = articles.filter(article => {
            return article.corpus && article.corpus.split('.').filter(s => s.trim().length > 0).length > 1;
        });

        return validArticles.slice(0,5);
    }

    async scrapeArticleDetails(page, articleUrl) {
        await page.goto(articleUrl, { waitUntil: 'networkidle2' });

        const articleData = await page.evaluate((url) => {
            const titleElement = document.querySelector('h1[class^="Story_strytitle"]');
            const kickerElement = document.querySelector('div.story-kicker h2');
            const imageElement = document.querySelector('img[src^="https://akm-img-a-in.tosshub.com/indiatoday/images/story/"]');
            const paragraphElements = document.querySelectorAll('p');
            const spanUpdate = document.querySelector('span.strydate');

            return {
                url: url, 
                title: titleElement ? titleElement.innerText.trim() : null,
                storyKicker: kickerElement ? kickerElement.innerText.trim() : null,
                image: imageElement ? imageElement.src : null,
                corpus: (kickerElement ? kickerElement.innerText.trim() + " " : "") + Array.from(paragraphElements).map(p => p.innerText.trim()).join(' '),
                dated: spanUpdate ? spanUpdate.innerText.trim() : null,
            };
        }, articleUrl);

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
        return articles;
    }
    
    async scrapeTrendingVideos() {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
    
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    
        const trendingVideosUrl = 'https://www.indiatoday.in';
        console.log('Fetching trending videos:', trendingVideosUrl);
    
        await page.goto(trendingVideosUrl, { waitUntil: 'networkidle2' });
        await page.waitForSelector('.swiper-wrapper'); // Ensure swiper-wrapper loads
    
        const videos = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.swiper-slide'))
                .map(slide => {
                    const titleElement = slide.querySelector('.card__slug');
                    const linkElement = slide.querySelector('.card__desc h3 a');
                    const url = linkElement ? linkElement.href : null;
                    const thumbnailElement = slide.querySelector('.thumb.playIconThumbContainer img');
                    
                    if (url && url.includes('podcasts.indiatoday.in')) return null; // Filter out podcast URLs
    
                    return {
                        title: titleElement ? titleElement.innerText.trim() : null,
                        url: url,
                        desc: linkElement ? linkElement.innerText.trim() : null,
                        thumbnail: thumbnailElement ? thumbnailElement.src : null
                    };
                })
                .filter(video => video && video.title && video.url); // Remove null entries
        });
    
        await browser.close();
        return videos;
    }
}

module.exports = WebScrapingService;
