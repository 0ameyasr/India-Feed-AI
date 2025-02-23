function showTopicArticles(topic) {
    const articlesList = document.getElementById('topic-articles');
    articlesList.innerHTML = '';

    const topicArticles = articlesData[topic] || [];

    topicArticles.forEach(article => {
        const li = document.createElement('li');
        li.className = 'list-group-item article-item';
        li.onclick = () => loadArticle(article.title, article.content, article.date, article.image_url);
        li.innerHTML = article.title;
        articlesList.appendChild(li);
    });

    if (topicArticles.length > 0) {
        const firstArticle = topicArticles[0];
        loadArticle(firstArticle.title, firstArticle.content, firstArticle.date, firstArticle.image_url);
    } else {
        loadArticle(
            'No Articles Available',
            'There are currently no articles in this topic.',
            ''
        );
    }
}

function loadArticle(title, content, date, image_url) {
    const articleContent = document.getElementById('article-content');
    articleContent.innerHTML = `
      <h2>${title || 'No Title Available'}</h2>
      ${date ? `<p><i>${date}</i></p>` : ''}
      <img src=${image_url} alt="Image" width="690" height="388"/>
      <div class="article-content">${content || 'No content available'}</div>
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