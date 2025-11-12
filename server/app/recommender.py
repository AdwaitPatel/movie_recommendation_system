# backend/app/recommender.py
import joblib, pickle
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

MODEL_DIR = '../saved_models'

tfidf = joblib.load(f'{MODEL_DIR}/tfidf_vectorizer.joblib')
knn = joblib.load(f'{MODEL_DIR}/knn_model.joblib')
with open(f'{MODEL_DIR}/metadata.pkl', 'rb') as f:
    metadata = pickle.load(f)
# metadata: dataframe with vec_index, title, poster_path, id, combined

def recommend_by_title(title, top_k=5):
    # find the closest title (case-insensitive)
    matches = metadata[metadata['title'].str.lower() == title.strip().lower()]
    if matches.empty:
        # fallback: fuzzy search by contains
        candidates = metadata[metadata['title'].str.lower().str.contains(title.strip().lower())]
        if candidates.empty:
            return []
        idx = candidates.iloc[0]['vec_index']
    else:
        idx = matches.iloc[0]['vec_index']

    # transform query vector
    query_vec = tfidf.transform([metadata.loc[metadata['vec_index']==idx, 'combined'].values[0]])
    distances, indices = knn.kneighbors(query_vec, n_neighbors=top_k+1)  # includes itself
    indices = indices.flatten()[1:top_k+1]  # drop itself
    results = []
    for i in indices:
        row = metadata[metadata['vec_index'] == i].iloc[0]
        poster_path = row.get('poster_path', '')
        if poster_path:
            poster_url = f"https://image.tmdb.org/t/p/w500{poster_path}"
        else:
            poster_url = "https://via.placeholder.com/500x750?text=No+Image"
        results.append({
            'title': row['title'],
            'poster_url': poster_url,
            'movie_id': int(row.get('id', -1))
        })
    return results