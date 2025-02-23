class NewsController {
    constructor(webScrapingService) {
        this.webScrapingService = webScrapingService;
        this.activeRequests = new Map();
    }

    async fetchNews(req, res) {
        const { topic, requestId } = req.body;
        console.log(`Received search request: ${topic}, ID: ${requestId}`);

        if (!topic) {
            return res.status(400).json({ error: 'Topic is required' });
        }

        if (this.activeRequests.has(requestId)) {
            this.activeRequests.get(requestId).abort();
            this.activeRequests.delete(requestId);
        }

        const abortController = new AbortController();
        this.activeRequests.set(requestId, abortController);

        try {
            const newsData = await this.webScrapingService.scrapeNews(topic, abortController.signal);
            res.status(200).json({ 
                requestId,
                articles: newsData 
            });
        } catch (error) {
            if (error.name === 'AbortError') {
                res.status(499).json({ 
                    requestId,
                    error: 'Search aborted by user' 
                });
            } else {
                res.status(500).json({ 
                    requestId,
                    error: 'An error occurred while fetching news' 
                });
            }
        } finally {
            this.activeRequests.delete(requestId);
        }
    }

    cancelRequest(req, res) {
        const { requestId } = req.body;
        
        if (this.activeRequests.has(requestId)) {
            this.activeRequests.get(requestId).abort();
            this.activeRequests.delete(requestId);
            console.log(`Cancelled request: ${requestId}`);
        }
        
        res.status(200).json({ message: 'Request cancelled' });
    }
}

module.exports = NewsController;