const axios = require('axios');
const cheerio = require('cheerio');

const scrapeNews = async (topic) => {
    try {
        const response = await axios.get(`https://news.google.com/search?q=${topic}`);
        const html = response.data;
        const $ = cheerio.load(html);
        const newsItems = [];

        $('article').each((index, element) => {
            const title = $(element).find('h3').text();
            const link = $(element).find('a').attr('href');
            if (title && link) {
                newsItems.push({ title, link: `https://news.google.com${link}` });
            }
        });

        return newsItems;
    } catch (error) {
        console.error('Error scraping news:', error);
        throw error;
    }
};

module.exports = scrapeNews;
