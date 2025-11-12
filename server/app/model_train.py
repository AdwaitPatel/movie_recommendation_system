# backend/app/model_train.py
import pandas as pd
import numpy as np
import re
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.neighbors import NearestNeighbors
from sklearn.decomposition import PCA
import pickle


def clean_text(text):
    if isinstance(text, str):
        return re.sub(r"\s+", " ", text).strip().lower()
    return ""


def load_and_merge(movies_path, credits_path):
    m = pd.read_csv(movies_path)
    c = pd.read_csv(credits_path)
    # ensure matching titles: credits has title column; sometimes name differences -> use title
    df = m.merge(c, on="title")
    return df


def extract_text_features(df):
    # Columns with list-like strings (genres, keywords, cast) are usually JSON-like; parse roughly:
    def parse_name_list(x):
        if pd.isna(x):
            return []
        # each item like {"id": 18, "name": "Drama"} or list of dicts in string form
        names = re.findall(
            r"'name': '([^']+)'|\"name\": \"([^\"]+)\"|\"name\": '([^']+)'|\'name\': \"([^\"]+)\"",
            str(x),
        )
        # flatten tuples
        result = [next(filter(None, grp)) for grp in names]
        return result

    df["genres_list"] = df["genres"].apply(parse_name_list)
    df["keywords_list"] = df["keywords"].apply(parse_name_list)

    # For cast: credits csv 'cast' often includes list of dicts - parse top 3 cast names
    def parse_cast(x, top_n=3):
        names = re.findall(r"'name': '([^']+)'|\"name\": \"([^\"]+)\"", str(x))
        extracted = [next(filter(None, grp)) for grp in names]
        return extracted[:top_n]

    df["cast_list"] = df["cast"].apply(parse_cast)

    # For directors: parse 'crew' column for director names
    def parse_director(x):
        if pd.isna(x):
            return []
        directors = []
        # find all dictionaries in the crew list string that have 'job': 'Director'
        pattern = r"\{[^}]*'job': 'Director'[^}]*\}"
        matches = re.findall(pattern, str(x))
        for match in matches:
            name_match = re.search(r"'name': '([^']+)'|\"name\": \"([^\"]+)\"", match)
            if name_match:
                name = next(filter(None, name_match.groups()))
                directors.append(name)
        return directors

    df["director_list"] = df["crew"].apply(parse_director)

    # overview
    # Truncate overview to 60 words before cleaning
    def truncate_overview(text, max_words=60):
        if not isinstance(text, str):
            return ""
        words = text.split()
        truncated = " ".join(words[:max_words])
        return truncated

    df["overview_trunc"] = df["overview"].fillna("").apply(truncate_overview)
    df["overview_clean"] = df["overview_trunc"].apply(clean_text)
    # title
    df["title_clean"] = df["title"].fillna("").apply(clean_text)

    # combined content with new weighting:
    # genres repeated 3 times, keywords 2 times, cast 2 times, directors once, include title and truncated overview
    def build_combined(r):
        genres = " ".join(r["genres_list"])
        keywords = " ".join(r["keywords_list"])
        cast = " ".join(r["cast_list"])
        directors = " ".join(r["director_list"])
        title = r["title_clean"]
        overview = r["overview_clean"]
        combined = (
            ((genres + " ") * 3)
            + ((keywords + " ") * 2)
            + ((cast + " ") * 2)
            + (directors + " ")
            + title + " "
            + overview
        )
        return combined.strip()
    df["combined"] = df.apply(build_combined, axis=1).fillna("")

    return df


def train_and_save(df, model_path_dir="saved_models"):
    # Ensure poster_path column exists
    if "poster_path" not in df.columns:
        df["poster_path"] = ""

    # vectorize
    tfidf = TfidfVectorizer(
        max_features=50000,
        stop_words="english",
        ngram_range=(1, 1),  # unigrams only
        min_df=2,
    )
    X = tfidf.fit_transform(df["combined"])

    # NearestNeighbors with cosine
    knn = NearestNeighbors(
        n_neighbors=10, metric="cosine", algorithm="brute"
    )  # 10 neighbors as requested
    knn.fit(X)

    # PCA for visualization (optional)
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(
        X.toarray()
    )  # for visualization only; careful with memory on large data

    # Save artifacts
    joblib.dump(tfidf, f"{model_path_dir}/tfidf_vectorizer.joblib")
    joblib.dump(knn, f"{model_path_dir}/knn_model.joblib")
    joblib.dump(pca, f"{model_path_dir}/pca_model.joblib")

    # Save metadata mapping (titles, poster_path, index)
    metadata = df[["title", "id", "poster_path", "combined"]].copy()
    metadata.reset_index(inplace=True)  # index column corresponds to vector index
    metadata.rename(columns={"index": "vec_index"}, inplace=True)
    with open(f"{model_path_dir}/metadata.pkl", "wb") as f:
        pickle.dump(metadata, f)

    print("Saved tfidf, knn, pca, metadata.")

    # Accuracy evaluation: approximate by genre overlap among neighbors
    np.random.seed(42)
    sample_indices = np.random.choice(X.shape[0], size=min(50, X.shape[0]), replace=False)
    neighbors = knn.kneighbors(X[sample_indices], return_distance=False)

    overlap_ratios = []
    genres_list = df["genres_list"].tolist()
    for i, nbrs in enumerate(neighbors):
        # nbrs includes the movie itself as first neighbor
        base_genres = set(genres_list[sample_indices[i]])
        # count neighbors with at least one genre in common (excluding itself)
        count_overlap = 0
        for idx in nbrs[1:]:
            if base_genres.intersection(genres_list[idx]):
                count_overlap += 1
        overlap_ratio = count_overlap / (len(nbrs) - 1)
        overlap_ratios.append(overlap_ratio)

    accuracy_score = np.mean(overlap_ratios)
    print(f"Approximate genre overlap accuracy on sample: {accuracy_score:.4f}")


if __name__ == "__main__":
    df = load_and_merge("../../data/tmdb_5000_movies.csv", "../../data/tmdb_5000_credits.csv")
    # drop irrelevant columns
    drop_cols = [
        "homepage",
        "budget",
        "status",
        "tagline",
        "production_companies",
        "production_countries",
        "spoken_languages",
    ]
    for c in drop_cols:
        if c in df.columns:
            df.drop(columns=c, inplace=True)
    df.drop_duplicates(subset="title", inplace=True)
    df[df.select_dtypes(include=["object"]).columns] = df.select_dtypes(include=["object"]).fillna("")
    df = extract_text_features(df)
    train_and_save(df, model_path_dir="../saved_models")
