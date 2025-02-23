class NewsController {
    constructor(webScrapingService) {
        this.webScrapingService = webScrapingService;
    }

    async fetchNews(req, res) {
        const { topic } = req.body;
        console.log('topic:', topic);

        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        try {
            const newsData = await this.webScrapingService.scrapeNews(topic);
            return res.status(200).json(newsData);
        } catch (error) {
            return res.status(500).json({ error: 'An error occurred while fetching news' });
        }
    }

    async fetchTrendingVideos(req, res) {
        try {
            const trendingVideos = await this.webScrapingService.scrapeTrendingVideos();
            return res.status(200).json(trendingVideos);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}

module.exports = NewsController;