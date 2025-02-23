function showTopicArticles(topic) {
    const articlesList = document.getElementById('topic-articles');
    articlesList.innerHTML = '';

    const topicArticles = articlesData[topic] || [];

    topicArticles.forEach(article => {
        const li = document.createElement('li');
        li.className = 'list-group-item article-item';
        li.onclick = () => loadArticle(article.title, article.content, article.date, article.image_url, article.article_url);
        li.innerHTML = article.title;
        articlesList.appendChild(li);
    });

    if (topicArticles.length > 0) {
        const firstArticle = topicArticles[0];
        loadArticle(firstArticle.title, firstArticle.content, firstArticle.date, firstArticle.image_url, firstArticle.article_url);
    } else {
        loadArticle(
            'No Articles Available',
            'There are currently no articles in this topic.',
            ''
        );
    }
}

function loadArticle(title, content, date, image_url, article_url) {
    const articleContent = document.getElementById('article-content');
    articleContent.innerHTML = `
      <h2>${title || 'No Title Available'}</h2>
      ${date ? `<p><i>${date}</i></p>` : ''}
      <img src=${image_url} alt="Image" width="600" height="300"/>
      <div class="article-content">${content || 'No content available'}</div>
      <a href=${article_url} target="_blank">Source</a>
    `;

    const articles = document.querySelectorAll('.article-item');
    articles.forEach(article => {
        if (article.textContent === title) {
            article.classList.add('active');
        } else {
            article.classList.remove('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    showTopicArticles('Finance');
});

function fetchWeather(lat, lon) {
    const apiKey = "ed81be9a5581a99556e37f20ab4a77f4";
    fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
    )
        .then((response) => response.json())
        .then((data) => {
            let temp = `${Math.round(data.main.temp)}°C`;
            let location = data.name;
            updateDateWeather(location, temp);
        })
        .catch((error) => {
            console.error("Weather fetch error:", error);
            updateDateWeather("Delhi", "N/A");
        });
}

function updateDateWeather(location, temp) {
    let date = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    document.getElementById(
        "date-weather"
    ).innerText = `${date} | ${location}, ${temp}`;
}

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) =>
            fetchWeather(position.coords.latitude, position.coords.longitude),
        (error) => {
            console.error("Geolocation error:", error);
            fetchWeather(28.6139, 77.209);
        }
    );
} else {
    fetchWeather(28.6139, 77.209);
}

document.addEventListener("DOMContentLoaded", function () {
    const articleItems = document.querySelectorAll(".article-list li");

    articleItems.forEach((item) => {
        item.addEventListener("click", function () {
            document.querySelectorAll(".article-list li").forEach((el) => {
                el.classList.remove("selected");
            });

            this.classList.add("selected");
        });
    });
});
