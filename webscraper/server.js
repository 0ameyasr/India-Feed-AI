const express = require('express');
const bodyParser = require('body-parser');
const scrapeNews = require('./scrapeNews');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());

app.post('/api/news', async (req, res) => {
    const { topic } = req.body;
    try {
        const news = await scrapeNews(topic);
        res.json(news);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
