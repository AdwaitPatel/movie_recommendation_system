from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from recommender import recommend_by_title

app = FastAPI(title="Movie Recommendation API")

origins = [
    "https://movie-recommendation-system-pca-knn.vercel.app",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Movie Recommendation API is running"}


@app.get("/recommend")
def recommend(title: str, k: int = 5):
    if not title:
        raise HTTPException(status_code=400, detail="Title is required")
    results = recommend_by_title(title, top_k=k)
    if not results:
        raise HTTPException(status_code=404, detail="No similar movies found")
    return {"query": title, "results": results}
