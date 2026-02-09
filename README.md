# 🎬 Movie Recommendation System

A fast, intelligent movie recommendation engine that uses machine learning to discover films similar to ones you love. Enter any movie title and instantly get personalized recommendations with poster artwork.

## ✨ Main Features

- **Intelligent Recommendations**: Uses TF-IDF vectorization and K-Nearest Neighbors (KNN) algorithm to find semantically similar movies based on genres, keywords, cast, and plot details
- **Beautiful UI**: Dark-themed, responsive interface built with React and Tailwind CSS
- **Movie Posters**: Real-time poster fetching from The Movie Database (TMDB) API
- **Customizable Results**: Adjust the number of recommendations (1-50) returned per search
- **Fast API**: RESTful FastAPI backend with CORS support for seamless frontend integration
- **Pre-trained Models**: Includes optimized TF-IDF vectorizer and KNN model trained on 5000+ TMDB movies

## 🚀 Getting Started

### Prerequisites

- **Python 3.9+**
- **Node.js 16+** and npm
- **TMDB API Key** (free at [themoviedb.org](https://www.themoviedb.org/settings/api))

### Installation & Running Locally

#### Backend Setup

```bash
# Navigate to server directory
cd server/app

# Install Python dependencies
pip install -r requirements.txt

# Configure TMDB API Key
# Edit .env and set your TMDB_API_KEY:
# TMDB_API_KEY=your_api_key_here

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```

The API will run on `http://localhost:8000`

#### Frontend Setup

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### Configuration

Create a `.env` file in `server/app/` with your TMDB API key:

```
TMDB_API_KEY=your_api_key_here
```

For frontend API URL configuration, create a `.env.local` in `client/`:

```
VITE_API_URL=http://localhost:8000
```

## 📁 Project Structure

```
Movie Recommendation System/
├── server/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py           # FastAPI application & endpoints
│   │   ├── recommender.py    # ML recommendation engine
│   │   ├── model_train.py    # Model training script
│   │   ├── requirements.txt  # Python dependencies
│   │   └── .env              # API keys (not in repo)
│   └── saved_models/         # Pre-trained ML models
│       ├── tfidf_vectorizer.joblib
│       ├── knn_model.joblib
│       └── pca_model.joblib
├── client/                    # React frontend
│   ├── src/
│   │   ├── App.jsx           # Main React component
│   │   ├── App.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── data/                      # Source datasets
    ├── tmdb_5000_movies.csv
    └── tmdb_5000_credits.csv
```

## 🔧 API Endpoints

### GET `/`
Health check endpoint. Returns a status message.

**Response:**
```json
{ "message": "Movie Recommendation API is running" }
```

### GET `/recommend`
Get movie recommendations based on a query title.

**Query Parameters:**
- `title` (string, required): Movie title to search for
- `k` (integer, optional): Number of recommendations (default: 5, max: 50)

**Example:**
```
GET http://localhost:8000/recommend?title=Interstellar&k=5
```

**Response:**
```json
{
  "query": "Interstellar",
  "results": [
    {
      "title": "The Martian",
      "poster_url": "https://image.tmdb.org/t/p/w500/...",
      "movie_id": 286217
    },
    ...
  ]
}
```

## 📦 Technology Stack

**Backend:**
- FastAPI - Modern web framework
- scikit-learn - Machine learning (TF-IDF, KNN)
- pandas/numpy - Data processing
- joblib - Model persistence
- python-dotenv - Configuration management

**Frontend:**
- React 19 - UI library
- Vite - Build tool & dev server
- Tailwind CSS - Utility-first styling

**Data & ML:**
- TMDB API - Movie metadata and posters
- TMDB 5000 Movies Dataset - Training data (5000+ films)

## 📝 License

This project is open source and available for personal and educational use.
