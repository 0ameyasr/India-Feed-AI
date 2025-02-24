const puppeteer = require('puppeteer');

class WebScrapingService {
    async scrapeNews(topic, signal) {
        let browser = null;
        try {
            if (signal.aborted) throw new Error("AbortError");

            const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox']
              });

            const page = await browser.newPage();
            await page.setDefaultNavigationTimeout(30000);
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36');
            
            const formattedTopic = encodeURIComponent(topic.toLowerCase().replace(/\s+/g, "-"));
            const searchUrl = `https://www.indiatoday.in/search/${formattedTopic}?ctype=story`;
            
            console.log('Fetching:', searchUrl);
            await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

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
                await browser.close();
            }
        }
    }

    async scrapeTrendingVideos() {
        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/opt/render/.cache/puppeteer/chrome/linux-133.0.6943.98/chrome' // **Added executablePath**
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

        await browser.close();
        return videos;
    }
}

module.exports = WebScrapingService;