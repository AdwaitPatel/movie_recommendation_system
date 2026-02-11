import "./App.css";
import { useState, useRef, useEffect } from "react";

function App() {
  const [title, setTitle] = useState("");
  const [k, setK] = useState(5);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");

  const API_BASE = import.meta.env.VITE_API_URL;

  const timersRef = useRef({});
  const [copiedIds, setCopiedIds] = useState([]);

  useEffect(() => {
    return () => {
      // cleanup any pending timers on unmount
      Object.values(timersRef.current).forEach((t) => clearTimeout(t));
      timersRef.current = {};
    };
  }, []);

  async function handleSearch(e) {
    e && e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a movie title");
      return;
    }
    setError(null);
    setLoading(true);
    setResults([]);
    setQuery(title);

    try {
      const url = `${API_BASE}/recommend?title=${encodeURIComponent(
        title,
      )}&k=${encodeURIComponent(k)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to fetch recommendations");
      }
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Movie Recommendation System
          </h1>
          <p className="text-gray-400 mt-2">
            Enter a movie name and number of results to find similar films.
          </p>
        </header>

        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-3 items-center mb-6"
        >
          <label htmlFor="title" className="sr-only">
            Movie title
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Interstellar"
            className="w-full sm:flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <label htmlFor="k" className="sr-only">
            Count
          </label>
          <input
            id="k"
            type="number"
            min={1}
            max={50}
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            className="w-28 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-center"
          />

          <button
            type="submit"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-lg shadow-md"
            aria-label="Search"
          >
            {loading ? (
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            ) : (
              "Search"
            )}
          </button>
        </form>

        {error && (
          <div className="mb-6 rounded-md bg-red-900/40 border border-red-800 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {query && !loading && results.length === 0 && !error && (
          <div className="mb-6 text-gray-400">
            No recommendations found for "{query}".
          </div>
        )}

        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {results.map((m) => (
              <article
                key={m.movie_id}
                className="group bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition"
              >
                <div className="relative h-64 w-full bg-gray-800 overflow-hidden">
                  <img
                    src={m.poster_url}
                    alt={m.title}
                    className="object-cover w-full h-full transition-transform duration-500 ease-out transform group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder_poster.png";
                    }}
                  />
                  {/* overlay now appears only on hover so images are not faded by default */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-300" />
                </div>

                <div className="p-4">
                  <div className="flex items-baseline gap-2">
                    <h3
                      className="text-lg font-medium truncate"
                      title={m.title}
                    >
                      {m.title}
                    </h3>
                    {m.year && (
                      <span className="text-sm text-gray-400">{`(${m.year})`}</span>
                    )}
                  </div>
                  {/* <p className="text-sm text-gray-400 mt-1">
                    TMDB ID: <span className="text-gray-200">{m.movie_id}</span>
                    {m.imdb_id && (
                      <span className="ml-3 text-xs text-gray-400">
                        IMDb: <span className="text-gray-200">{m.imdb_id}</span>
                      </span>
                    )}
                  </p> */}

                  <div className="mt-4 flex items-center justify-between">
                    <a
                      href={
                        m.imdb_id
                          ? `https://www.imdb.com/title/${m.imdb_id}`
                          : `https://www.themoviedb.org/movie/${m.movie_id}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-indigo-300 hover:text-indigo-400"
                    >
                      View More
                    </a>

                    <button
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard
                            .writeText(m.title)
                            .catch(() => {});
                        }

                        // clear any existing timer for this id
                        if (timersRef.current[m.movie_id]) {
                          clearTimeout(timersRef.current[m.movie_id]);
                        }

                        setCopiedIds((prev) =>
                          prev.includes(m.movie_id)
                            ? prev
                            : [...prev, m.movie_id],
                        );

                        timersRef.current[m.movie_id] = setTimeout(() => {
                          setCopiedIds((prev) =>
                            prev.filter((id) => id !== m.movie_id),
                          );
                          delete timersRef.current[m.movie_id];
                        }, 3000);
                      }}
                      className={`text-sm px-3 py-1 rounded transition-transform duration-200 ${
                        copiedIds.includes(m.movie_id)
                          ? "bg-green-600 hover:bg-green-500 text-white scale-105"
                          : "bg-gray-800 hover:bg-gray-700 text-gray-200"
                      }`}
                    >
                      {copiedIds.includes(m.movie_id) ? "Copied" : "Copy title"}
                    </button>
                  </div>
                </div>
              </article>
            ))}

            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-gray-900 border border-gray-800 rounded-xl h-64"
                />
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// export default App;


import Home from "./home";

export default Home;
