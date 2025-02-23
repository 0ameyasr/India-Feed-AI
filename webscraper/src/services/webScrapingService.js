const puppeteer = require('puppeteer');

class WebScrapingService {
    async scrapeNews(topic, signal) {
        if (signal.aborted) throw new Error("AbortError");

        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        if (signal.aborted) {
            await browser.close();
            throw new Error("AbortError");
        }
        
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36');
        
        const formattedTopic = topic.toLowerCase().replace(/\s+/g, "-");
        const searchUrl = `https://www.indiatoday.in/search/${formattedTopic}&ctype=story`;
        
        console.log('Fetching:', searchUrl);

        if (signal.aborted) throw new Error('AbortError');

        await page.goto(searchUrl, { waitUntil: 'networkidle2' });
        await page.waitForSelector('#more_content_container');

        if (signal.aborted) throw new Error('AbortError');

        const articleLinks = await page.evaluate(() => {
            const container = document.querySelector('#more_content_container');
            return container
                ? Array.from(container.querySelectorAll('a.grid_card_link'))
                    .map(a => a.href)
                    .filter(link => !link.includes('/visualstories/') && !link.includes('/magazine/'))
                    .slice(0, 5)
                : [];
        });

        if (signal.aborted) throw new Error('AbortError');

        const articles = await this.scrapeTopArticles(articleLinks, signal);

        await browser.close();
        return articles;
    }

    async scrapeTopArticles(articleLinks, signal) {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        const articles = [];
        for (const link of articleLinks) {
            if (signal.aborted) {
                await browser.close();
                throw new Error('AbortError');
            }

            try {
                console.log(`Fetching article: ${link}`);
                const articleData = await this.scrapeArticleDetails(page, link, signal);
                articles.push(articleData);
            } catch (error) {
                console.error(`Error scraping article ${link}:`, error);
            }
        }

        await browser.close();
        return articles;
    }

    async scrapeArticleDetails(page, articleUrl, signal) {
        if (signal.aborted) throw new Error('AbortError');

        await page.goto(articleUrl, { waitUntil: 'networkidle2' });

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
                corpus: (kickerElement ? kickerElement.innerText.trim() + " " : "") + Array.from(paragraphElements).map(p => p.innerText.trim()).join(' '),
                dated: spanUpdate ? spanUpdate.innerText.trim() : null,
            };
        }, articleUrl);
    }
}

module.exports = WebScrapingService;
