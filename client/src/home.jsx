import { useEffect, useRef, useState } from "react";

const posterRows = [
  [
    "https://image.tmdb.org/t/p/w500/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg",
    "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    "https://image.tmdb.org/t/p/w500/p1F51Lvj3sMopG948F5HsBbl43C.jpg",
    "https://image.tmdb.org/t/p/w500/yF1eOkaYvwiORauRCPWznV9xVvi.jpg",
  ],
  [
    "https://image.tmdb.org/t/p/w500/6ELJEzQJ3Y45HczvreC3dg0GV5R.jpg",
    "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    "https://image.tmdb.org/t/p/w500/r7vmZjiyZw9rpJMQJdXpjgiCOk9.jpg",
    "https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg",
    "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
  ],
  [
    "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    "https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
    "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
    "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
  ],
];

function PosterRow({ posters, reverse = false, duration = 45 }) {
  const looped = [...posters, ...posters];

  return (
    <div className="relative w-full overflow-hidden">
      <div
        className={`flex w-max gap-4 px-2 animate-[marquee_linear_infinite] ${
          reverse ? "[animation-direction:reverse]" : ""
        }`}
        style={{ animationDuration: `${duration}s` }}
      >
        {looped.map((src, i) => (
          <div
            key={`${src}-${i}`}
            className="h-56 w-40 sm:h-64 sm:w-44 md:h-72 md:w-48 shrink-0 overflow-hidden rounded-2xl bg-zinc-900/90 ring-1 ring-white/10"
          >
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover select-none pointer-events-none"
              draggable="false"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [title, setTitle] = useState("");
  const [k, setK] = useState(5);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [copiedIds, setCopiedIds] = useState([]);
  const timersRef = useRef({});
  const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(
    /\/$/,
    "",
  );

  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach((t) => clearTimeout(t));
      timersRef.current = {};
    };
  }, []);

  async function handleSearch(e) {
    e.preventDefault();

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
      if (err instanceof TypeError) {
        setError("Cannot reach backend. Check VITE_API_URL and backend server.");
      } else {
        setError(err.message || "Unknown error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Sora:wght@500;700;800&display=swap');
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}
      </style>

      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08)_0%,rgba(0,0,0,0.95)_70%)]" />
        <div className="relative flex h-full flex-col justify-center gap-5 px-4 py-8">
          <PosterRow posters={posterRows[0]} duration={42} />
          <PosterRow posters={posterRows[1]} reverse duration={48} />
          <PosterRow posters={posterRows[2]} duration={44} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/15 to-black/75" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-6 sm:px-6 sm:py-8">
        <div className="w-full rounded-3xl border border-white/15 bg-black/50 p-4 shadow-2xl backdrop-blur-md sm:p-6">
          <header className="mb-5">
            <h1 className="text-3xl font-black tracking-tight text-white [font-family:Sora,sans-serif] sm:text-5xl">
              Movie Recommendation System
            </h1>
            <p className="mt-2 text-sm text-zinc-300 sm:text-base">
              Enter a movie title and get similar picks.
            </p>
          </header>

          <form onSubmit={handleSearch} className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-12">
            <label htmlFor="title" className="sr-only">
              Movie title
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Interstellar"
              className="sm:col-span-7 w-full rounded-xl border border-white/15 bg-zinc-900/70 px-4 py-3 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
              className="sm:col-span-2 w-full rounded-xl border border-white/15 bg-zinc-900/70 px-4 py-3 text-center text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />

            <button
              type="submit"
              className="sm:col-span-3 inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-medium text-black transition hover:bg-cyan-400"
              aria-label="Search"
            >
              {loading ? (
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              ) : (
                "Search"
              )}
            </button>
          </form>

          {error && (
            <div className="mb-4 rounded-xl border border-red-800 bg-red-900/40 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {query && !loading && results.length === 0 && !error && (
            <div className="mb-4 text-sm text-zinc-300">
              No recommendations found for "{query}".
            </div>
          )}

          <section>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {results.map((m) => (
                <article
                  key={m.movie_id}
                  className="group overflow-hidden rounded-xl border border-white/10 bg-zinc-900/75 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-56 w-full overflow-hidden bg-zinc-800 sm:h-64">
                    <img
                      src={m.poster_url}
                      alt={m.title}
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder_poster.png";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/50" />
                  </div>

                  <div className="p-3">
                    <div className="flex items-baseline gap-2">
                      <h3 className="truncate text-sm font-medium text-white sm:text-base" title={m.title}>
                        {m.title}
                      </h3>
                      {m.year && <span className="text-xs text-zinc-400">{`(${m.year})`}</span>}
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <a
                        href={
                          m.imdb_id
                            ? `https://www.imdb.com/title/${m.imdb_id}`
                            : `https://www.themoviedb.org/movie/${m.movie_id}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-cyan-300 hover:text-cyan-200 sm:text-sm"
                      >
                        View More
                      </a>

                      <button
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(m.title).catch(() => {});
                          }

                          if (timersRef.current[m.movie_id]) {
                            clearTimeout(timersRef.current[m.movie_id]);
                          }

                          setCopiedIds((prev) =>
                            prev.includes(m.movie_id) ? prev : [...prev, m.movie_id],
                          );

                          timersRef.current[m.movie_id] = setTimeout(() => {
                            setCopiedIds((prev) => prev.filter((id) => id !== m.movie_id));
                            delete timersRef.current[m.movie_id];
                          }, 3000);
                        }}
                        className={`rounded-lg px-2 py-1 text-xs transition sm:text-sm ${
                          copiedIds.includes(m.movie_id)
                            ? "scale-105 bg-green-600 text-white hover:bg-green-500"
                            : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                        }`}
                      >
                        {copiedIds.includes(m.movie_id) ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}

              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-64 animate-pulse rounded-xl border border-white/10 bg-zinc-900/70"
                  />
                ))}
            </div>
          </section>

          {!loading && results.length === 0 && !error && (
            <div className="mt-6 rounded-xl border border-white/10 bg-zinc-900/50 p-4 text-center text-sm text-zinc-300">
              Discover your next favorite movie.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
