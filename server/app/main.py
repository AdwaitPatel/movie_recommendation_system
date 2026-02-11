from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
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
    html = """
        <!doctype html>
        <html lang="en">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <title>Movie Recommendation API</title>
                <style>
                    :root{--bg:#0b1220;--card:#0f1724;--muted:#94a3b8;--accent:#6366f1}
                    body{margin:0;font-family:Inter,system-ui,Segoe UI,Roboto,'Helvetica Neue',Arial;background:var(--bg);color:#e6eef8}
                    .wrap{max-width:920px;margin:6vh auto;padding:28px}
                    .card{background:linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.02));border:1px solid rgba(255,255,255,0.04);padding:24px;border-radius:12px}
                    h1{margin:0;font-size:28px}
                    p.lead{color:var(--muted);margin:8px 0 18px}
                    .actions{display:flex;gap:12px;flex-wrap:wrap}
                    a.btn{display:inline-block;padding:10px 14px;border-radius:8px;background:var(--accent);color:white;text-decoration:none;font-weight:600}
                    pre{background:#071022;color:#cfe8ff;padding:12px;border-radius:8px;overflow:auto}
                    .meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px;color:var(--muted)}
                    footer{margin-top:18px;color:var(--muted);font-size:13px}
                </style>
            </head>
            <body>
                <div class="wrap">
                    <div class="card">
                        <h1>Movie Recommendation API</h1>
                        <p class="lead">FastAPI service that returns K nearest movie recommendations. Try the interactive docs or open the frontend.</p>

                        <div class="actions">
                            <a class="btn" href="/docs" target="_blank">Open API Docs</a>
                            <a class="btn" href="https://movie-recommendation-system-pca-knn.vercel.app" target="_blank" style="background:#10b981">Open Frontend</a>
                        </div>

                        <div class="meta">
                            <div>
                                <strong>Health</strong>
                                <div>GET <code>/</code> — this page</div>
                                <div>GET <code>/recommend?title=Interstellar&amp;k=5</code></div>
                            </div>
                            <div>
                                <strong>Example Response</strong>
                                <pre>{
    "query": "Interstellar",
    "results": [ { "title": "...", "poster_url": "...", "year": "2014", "imdb_id": "tt0816692", "movie_id": 157336 } ]
}</pre>
                            </div>
                        </div>

                        <h3 style="margin-top:18px">Quick curl</h3>
                        <pre>curl "http://localhost:8000/recommend?title=Interstellar&amp;k=5"</pre>

                        <footer>Powered by FastAPI · Recommendations built with TF-IDF + KNN · Poster lookup via OMDB</footer>
                    </div>
                </div>
            </body>
        </html>
        """
    return HTMLResponse(content=html, status_code=200)


@app.get("/recommend")
def recommend(title: str, k: int = 5):
    if not title:
        raise HTTPException(status_code=400, detail="Title is required")
    results = recommend_by_title(title, top_k=k)
    if not results:
        raise HTTPException(status_code=404, detail="No similar movies found")
    return {"query": title, "results": results}
