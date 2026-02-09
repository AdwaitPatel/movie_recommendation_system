# backend/app/recommender.py
import joblib, pickle
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import requests
import os
from dotenv import load_dotenv

MODEL_DIR = "../saved_models"

load_dotenv()

# Use OMDB for poster images. Ensure OMDB_API_KEY is set in server/app/.env
OMDB_API_KEY = os.getenv("OMDB_API_KEY")
OMDB_BASE = "https://www.omdbapi.com/"
DEFAULT_IMG = "https://via.placeholder.com/500x750?text=No+Image"

tfidf = joblib.load(f"{MODEL_DIR}/tfidf_vectorizer.joblib")
knn = joblib.load(f"{MODEL_DIR}/knn_model.joblib")
with open(f"{MODEL_DIR}/metadata.pkl", "rb") as f:
    metadata = pickle.load(f)
# metadata: dataframe with vec_index, title, poster_path, id, combined


def fetch_poster_from_omdb(title):
    """Query OMDB by exact title and return the Poster URL or DEFAULT_IMG.

    OMDB returns a `Poster` field which may be a valid URL or the string 'N/A'.
    We query by title (`t` parameter) for a direct lookup.
    """
    if not OMDB_API_KEY:
        return DEFAULT_IMG

    params = {"apikey": OMDB_API_KEY, "t": title}
    try:
        response = requests.get(OMDB_BASE, params=params, timeout=5)
        response.raise_for_status()
        data = response.json()
        poster = data.get("Poster")
        year = data.get("Year")
        imdb_id = data.get("imdbID")
        # OMDB uses 'N/A' when no poster is available
        poster_url = poster if poster and poster != "N/A" else DEFAULT_IMG
        return {"poster_url": poster_url, "year": year or "", "imdb_id": imdb_id or ""}
    except Exception:
        pass
    return {"poster_url": DEFAULT_IMG, "year": "", "imdb_id": ""}


def recommend_by_title(title, top_k=5):
    # find the closest title (case-insensitive)
    matches = metadata[metadata["title"].str.lower() == title.strip().lower()]
    if matches.empty:
        # fallback: fuzzy search by contains
        candidates = metadata[
            metadata["title"].str.lower().str.contains(title.strip().lower())
        ]
        if candidates.empty:
            return []
        idx = candidates.iloc[0]["vec_index"]
    else:
        idx = matches.iloc[0]["vec_index"]

    # transform query vector
    query_vec = tfidf.transform(
        [metadata.loc[metadata["vec_index"] == idx, "combined"].values[0]]
    )
    distances, indices = knn.kneighbors(
        query_vec, n_neighbors=top_k + 1
    )  # includes itself
    indices = indices.flatten()[1 : top_k + 1]  # drop itself
    results = []
    for i in indices:
        row = metadata[metadata["vec_index"] == i].iloc[0]
        poster_info = fetch_poster_from_omdb(row["title"])
        results.append(
            {
                "title": row["title"],
                "poster_url": poster_info.get("poster_url"),
                "year": poster_info.get("year"),
                "imdb_id": poster_info.get("imdb_id"),
                "movie_id": int(row.get("id", -1)),
            }
        )
    return results
