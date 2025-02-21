# Web Scraping App - Backend

This is the backend part of the Web Scraping App, which allows users to input a news topic and retrieves the latest news articles from reliable sources.

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd web-scraping-app/backend
   ```

2. **Install dependencies:**
   ```
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the `backend` directory and add your MongoDB connection string and any other necessary API keys.

4. **Run the application:**
   ```
   npm start
   ```

## API Usage

### Endpoints

- **POST /api/news**
  - Description: Fetches news articles based on the user's query.
  - Request Body: 
    ```json
    {
      "topic": "string"
    }
    ```
  - Response: Returns a list of news articles related to the topic.

## Folder Structure

- `src/app.js`: Entry point of the application, sets up the server and routes.
- `src/controllers/newsController.js`: Contains the logic for processing news queries.
- `src/routes/newsRoutes.js`: Defines the API endpoints.
- `src/services/webScrapingService.js`: Implements the web scraping logic.
- `src/models/newsModel.js`: Mongoose model for news articles.

## Technologies Used

- Node.js
- Express
- Mongoose
- Axios
- dotenv

## License

This project is licensed under the MIT License.