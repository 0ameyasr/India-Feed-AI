document.addEventListener('DOMContentLoaded', () => {
    showTopicArticles('Finance');
});

let currentPage = 0;
const articlesPerPage = 5;

function showTopicArticles(topic) {
    if (window.currentTopic !== topic) {
        currentPage = 0;
    }
    window.currentTopic = topic;

    const articlesList = document.getElementById('topic-articles');
    articlesList.innerHTML = '';

    const topicArticles = articlesData[topic] || [];
    const totalPages = Math.ceil(topicArticles.length / articlesPerPage);

    const start = currentPage * articlesPerPage;
    const end = start + articlesPerPage;
    const displayedArticles = topicArticles.slice(start, end);

    displayedArticles.forEach(article => {
        const li = document.createElement('li');
        li.className = 'list-group-item article-item';

        const dateSpan = document.createElement('span');
        dateSpan.className = 'article-date';
        dateSpan.textContent = `${article.date}`;
        dateSpan.style.fontSize = '0.85em';
        dateSpan.style.color = 'gray';
        dateSpan.style.marginLeft = '8px';

        li.innerHTML = article.title;
        li.appendChild(dateSpan);

        li.onclick = function () {
            loadArticle(article.title, article.content, article.date, article.image_url, article.article_url);

            document.querySelectorAll('.article-item').forEach(el => {
                el.classList.remove('selected');
            });

            this.classList.add('selected');
        };

        articlesList.appendChild(li);
    });

    addPaginationControls(topic, totalPages);
    
    if (displayedArticles.length > 0) {
        const firstArticle = displayedArticles[0];
        loadArticle(firstArticle.title, firstArticle.content, firstArticle.date, firstArticle.image_url, firstArticle.article_url);
        document.querySelector('.article-item').classList.add('selected');
    } else {
        loadArticle('No Articles Available', 'There are currently no articles in this topic.', '');
    }
}

function addPaginationControls(topic, totalPages) {
    const paginationContainer = document.getElementById('pagination-controls');
    if (!paginationContainer) {
        console.error("Pagination container not found!");
        return;
    }

    paginationContainer.innerHTML = '';

    const totalArticles = articlesData[topic]?.length || 0;
    const start = currentPage * articlesPerPage + 1;
    const end = Math.min((currentPage + 1) * articlesPerPage, totalArticles);

    const countDisplay = document.createElement('span');
    countDisplay.textContent = `Showing ${start}-${end} of ${totalArticles} articles`;
    countDisplay.className = 'me-3 text-muted';

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.className = 'btn btn-sm btn-secondary me-2';
    prevButton.disabled = (currentPage === 0);
    prevButton.onclick = function () {
        if (currentPage > 0) {
            currentPage--;
            showTopicArticles(topic);
        }
    };

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.className = 'btn btn-sm btn-secondary';
    nextButton.disabled = (currentPage >= totalPages - 1);
    nextButton.onclick = function () {
        if (currentPage < totalPages - 1) {
            currentPage++;
            showTopicArticles(topic);
        }
    };

    paginationContainer.appendChild(countDisplay);
    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(nextButton);
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

    document.querySelectorAll('.article-item').forEach(article => {
        if (article.textContent === title) {
            article.classList.add('selected');
        } else {
            article.classList.remove('selected');
        }
    });
}

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

$(document).ready(function () {
    let searchController;
    let currentRequestId;

    $("#newsSearchForm").submit(function (event) {
        event.preventDefault();

        let topic = $("#searchInput").val().trim();
        let searchButton = $("#newsSearchForm button");
        currentRequestId = Date.now();

        if (!topic) {
            alert("Please enter a topic.");
            return;
        }

        if (searchController) {
            searchController.abort();
            searchController = null;
        }

        searchController = new AbortController();

        searchButton.prop("disabled", true).text("Searching...");
        $("#modalContent").html('<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>');
        $("#newsModal").modal("show");

        fetch(`http://localhost:7070/api/news/fetch-news`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                topic, 
                requestId: currentRequestId 
            }),
            signal: searchController.signal
        })
        .then(response => {
            if (!response.ok) throw new Error("Server error");
            return response.json();
        })
        .then(data => {
            if (currentRequestId === data.requestId) {
                $("#modalContent").html('<p class="text-success">Collected all articles</p>');
                
                setTimeout(() => {
                    $("#modalContent").html(` 
                        <div class="text-center">
                            <div class="spinner-border text-primary" role="status"></div>
                            <p class="mt-2">Processing...</p>
                        </div>
                    `);
        
                    fetch('http://localhost:7000/processed-articles', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data.articles)
                    })
                    .then(response => response.json())
                    .then(processedData => {
                        let contentHtml = '<div class="container">';

                        processedData.forEach(article => {
                            contentHtml += `
                                <div class="card mb-4 shadow-lg p-3 rounded border-0">
                                    <div class="row g-0">
                                        <div class="col-md-4 d-flex align-items-center">
                                            <img src="${article.image}" class="img-fluid rounded" alt="News Image" style="width: 100%; height: 200px; object-fit: cover;">
                                        </div>
                                        <div class="col-md-8">
                                            <div class="card-body">
                                                <h5 class="card-title fw-bold">${article.title}</h5>
                                                <p class="text-muted"><small>${article.date}</small></p>
                                                <p class="card-text printed">${article.article}</p>
                                                <a href="${article.url}" target="_blank" class="btn btn-primary btn-sm mt-2">Read More</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });

                        contentHtml += '</div>';
                        $("#modalContent").html(contentHtml);
                    })
                    .catch(error => {
                        $("#modalContent").html("<p class='text-danger'>Failed to process articles.</p>");
                        console.error("Processing error:", error);
                    });

                }, 1500);
            }
        })
        .catch(error => {
            if (error.name === "AbortError") {
                console.log("Request aborted");
            } else {
                $("#modalContent").html("<p class='text-danger'>Failed to fetch news, Please try again. " + error + " </p>");
                console.error("Fetch error:", error);
            }
        })
        .finally(() => {
            searchButton.prop("disabled", false).text("Search");
        });
    });

    $("#newsModal").on("hidden.bs.modal", function () {
        if (searchController) {
            searchController.abort();
            searchController = null;
            
            fetch(`http://localhost:5000/api/news/cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId: currentRequestId })
            }).catch(error => console.error("Error canceling request:", error));
        }
    });
});

function googleTranslateElementInit() {
    new google.translate.TranslateElement({pageLanguage: 'en'}, 'google_translate_element');
}