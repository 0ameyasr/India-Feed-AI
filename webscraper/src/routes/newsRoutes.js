const express = require('express');
const router = express.Router();
const NewsController = require('../controllers/newsController');
const WebScrapingService = require('../services/webScrapingService');

const webScrapingService = new WebScrapingService();
const newsController = new NewsController(webScrapingService);

router.post('/fetch-news', (req, res) => newsController.fetchNews(req, res));
router.get('/trending-videos', (req, res) => newsController.fetchTrendingVideos(req, res));

module.exports = router;