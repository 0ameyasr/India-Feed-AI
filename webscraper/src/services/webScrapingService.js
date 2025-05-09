const puppeteer = require('puppeteer');

class WebScrapingService {
    async scrapeNews(topic, signal) {
        let browser = null;
        try {
            if (signal.aborted) throw new Error("AbortError");

            browser = await puppeteer.connect({
                browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_API_KEY}`
            });

            const page = await browser.newPage();
            await page.setDefaultNavigationTimeout(30000);
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36');
            
            const formattedTopic = encodeURIComponent(topic.toLowerCase().replace(/\s+/g, "-"));
            const searchUrl = `https://www.indiatoday.in/search/${formattedTopic}?ctype=story`;
            
            console.log('Fetching:', searchUrl);

            await page.goto(searchUrl, { waitUntil: 'load', timeout: 30000 });      
            await page.waitForSelector('#more_content_container', { timeout: 10000 });

            if (signal.aborted) throw new Error('AbortError');

            const articleLinks = await page.evaluate(() => {
                const container = document.querySelector('#more_content_container');
                if (!container) return [];
                
                return Array.from(container.querySelectorAll('a.grid_card_link'))
                    .map(a => a.href)
                    .filter(link => (
                        link && 
                        link.startsWith('https://www.indiatoday.in') &&
                        !link.includes('/visualstories/') && 
                        !link.includes('/magazine/') && 
                        !link.includes('podcasts.indiatoday') &&
                        !link.includes('www.aajtak.in')
                    ))
                    .slice(0, 5);
            });

            console.log(`Found ${articleLinks.length} article links`);
            if (articleLinks.length === 0) {
                throw new Error('No articles found for the given topic');
            }

            const articles = await this.scrapeTopArticles(articleLinks, signal, browser);
            return articles;

        } catch (error) {
            console.error('Scraping error:', error);
            throw error;
        } finally {
            if (browser) {
                await browser.disconnect();
            }
        }
    }

    async scrapeTopArticles(articleLinks, signal, browser) {
        const articles = [];
        const page = await browser.newPage();
        
        for (const link of articleLinks) {
            if (signal.aborted) throw new Error('AbortError');

            try {
                console.log(`Fetching article: ${link}`);
                const articleData = await this.scrapeArticleDetails(page, link, signal);
                if (articleData) {
                    articles.push(articleData);
                }
            } catch (error) {
                console.error(`Error scraping article ${link}:`, error);
                continue;
            }
        }

        return articles;
    }

    async scrapeArticleDetails(page, articleUrl, signal) {
        if (signal.aborted) throw new Error('AbortError');

        try {
            await page.goto(articleUrl, { 
                waitUntil: 'networkidle2',
                timeout: 30000 
            });

            if (signal.aborted) throw new Error('AbortError');

            return await page.evaluate((url) => {
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
                    corpus: (kickerElement ? kickerElement.innerText.trim() + " " : "") + 
                           Array.from(paragraphElements)
                               .map(p => p.innerText.trim())
                               .filter(text => text.length > 0)
                               .join(' '),
                    dated: spanUpdate ? spanUpdate.innerText.trim() : null,
                };
            }, articleUrl);

        } catch (error) {
            console.error(`Failed to scrape article ${articleUrl}:`, error);
            return null;
        }
    }

    
    async scrapeTrendingVideos() {
        let browser = null;
        try {
            browser = await puppeteer.connect({
                browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_API_KEY}`
            });

            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
            await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

            const trendingVideosUrl = 'https://www.indiatoday.in';
            console.log('Fetching trending videos:', trendingVideosUrl);

            await page.goto(trendingVideosUrl, { waitUntil: 'networkidle2' });
            await page.waitForSelector('.swiper-wrapper');

            const videos = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('.swiper-slide'))
                    .map(slide => {
                        const titleElement = slide.querySelector('.card__slug');
                        const linkElement = slide.querySelector('.card__desc h3 a');
                        const url = linkElement ? linkElement.href : null;
                        const thumbnailElement = slide.querySelector('.thumb.playIconThumbContainer img');

                        if (url && url.includes('podcasts.indiatoday.in')) return null;

                        return {
                            title: titleElement ? titleElement.innerText.trim() : null,
                            url: url,
                            desc: linkElement ? linkElement.innerText.trim() : null,
                            thumbnail: thumbnailElement ? thumbnailElement.src : null
                        };
                    })
                    .filter(video => video && video.title && video.url);
            });

            return videos;
        } catch (error) {
            console.error('Error fetching trending videos:', error);
            throw error;
        } finally {
            if (browser) {
                await browser.disconnect();
            }
        }
    }
}

module.exports = WebScrapingService;