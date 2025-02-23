const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const newsRoutes = require('./routes/newsRoutes');
const cors = require('cors');
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.use('/api/news', newsRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});