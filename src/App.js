import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import "./App.css";

const API_KEY = "f6d8b35cff24c19d75bc0b68e984935e";
const IMAGE_PATH = "https://image.tmdb.org/t/p/w500";

/* HOME PAGE*/
function Home() {
  const navigate = useNavigate();
  const [hasSearched, setHasSearched] = useState(
    JSON.parse(localStorage.getItem("hasSearched")) || false
  );
  const [movies, setMovies] = useState(
    JSON.parse(localStorage.getItem("movies")) || []
  );
  const [filteredMovies, setFilteredMovies] = useState(
    JSON.parse(localStorage.getItem("filteredMovies")) || []
  );
  const [search, setSearch] = useState(localStorage.getItem("search") || "");
  const [yearFilter, setYearFilter] = useState(localStorage.getItem("yearFilter") || "");
  const [genreFilter, setGenreFilter] = useState(localStorage.getItem("genreFilter") || "");
  const [watchlist, setWatchlist] = useState(
    JSON.parse(localStorage.getItem("watchlist")) || []
  );
  const [genreList, setGenreList] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [popup, setPopup] = useState("");

  // Persist state
  useEffect(() => {
    localStorage.setItem("hasSearched", JSON.stringify(hasSearched));
    localStorage.setItem("movies", JSON.stringify(movies));
    localStorage.setItem("filteredMovies", JSON.stringify(filteredMovies));
    localStorage.setItem("search", search);
    localStorage.setItem("yearFilter", yearFilter);
    localStorage.setItem("genreFilter", genreFilter);
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
  }, [hasSearched, movies, filteredMovies, search, yearFilter, genreFilter, watchlist]);

  // Body class toggle
  useEffect(() => {
    if (hasSearched) document.body.classList.add("has-searched");
    else document.body.classList.remove("has-searched");
  }, [hasSearched]);

  // Fetch genres
  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}`)
      .then(res => res.json())
      .then(data => setGenreList(data.genres));
  }, []);

  const handleSearch = () => {
    if (!search) return;
    fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${search}`
    )
      .then(res => res.json())
      .then(data => {
        const results = data.results || [];
        setMovies(results);
        setFilteredMovies(results);
        setShowFilter(false);
        setYearFilter("");
        setGenreFilter("");
        setHasSearched(true);
      });
  };

  const applyFilters = () => {
    let filtered = movies;
    if (yearFilter) {
      filtered = filtered.filter(
        m => m.release_date && m.release_date.startsWith(yearFilter)
      );
    }
    if (genreFilter) {
      filtered = filtered.filter(
        m => m.genre_ids?.some(id => genreList.find(g => g.id === id)?.name === genreFilter)
      );
    }
    setFilteredMovies(filtered);
  };

  const addToWatchlist = (movie) => {
    if (!watchlist.some(m => m.id === movie.id)) {
      setWatchlist([...watchlist, movie]);
      setPopup("Added to Watchlist ✔");
      setTimeout(() => setPopup(""), 2000);
    }
  };

  return (
    <div className="App">
      <h1
        style={{ cursor: "pointer" }}
        onClick={() => {
          setHasSearched(false);
          setSearch("");
          setMovies([]);
          setFilteredMovies([]);
          setShowFilter(false);
        }}
      >
        🎬 Movie Search App
      </h1>

      {/* Top Bar */}
      <div className="top-bar">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search movies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
          <span className="icon" onClick={handleSearch}>🔍</span>
          {hasSearched && (
            <span className="icon" onClick={() => setShowFilter(!showFilter)}>⚙️</span>
          )}
        </div>

        {/* Watchlist badge */}
        {hasSearched && (
          <div className="watchlist-icon" onClick={() => navigate("/watchlist")}>
            📌Watchlist
            {watchlist.length > 0 && (
              <span className="watchlist-badge">{watchlist.length}</span>
            )}
          </div>
        )}
      </div>

      {popup && <div className="popup">{popup}</div>}

      {/* Filter Menu */}
      {hasSearched && showFilter && (
        <div className="filter-menu">
          <input
            type="number"
            placeholder="Release Year"
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
          />
          <select value={genreFilter} onChange={e => setGenreFilter(e.target.value)}>
            <option value="">All Genres</option>
            {genreList.map(g => (
              <option key={g.id} value={g.name}>{g.name}</option>
            ))}
          </select>
          <button onClick={applyFilters}>Apply</button>
        </div>
      )}

      {/* Movie Results */}
      {hasSearched && (
        <>
          <h2>Results</h2>
          <div className="movies-grid">
            {(filteredMovies.length ? filteredMovies : movies).length === 0 ? (
              <p style={{ gridColumn: "1 / -1", textAlign: "center" }}>
                No movies found 😢
              </p>
            ) : (
              (filteredMovies.length ? filteredMovies : movies).map(movie => (
                <div className="movie-card" key={movie.id}>
                  {movie.poster_path ? (
                    <img src={IMAGE_PATH + movie.poster_path} alt={movie.title} />
                  ) : (
                    <div className="no-poster">
                      <span>{movie.title}</span>
                    </div>
                  )}
                  <Link
                    to={`/movie/${movie.id}`}
                    className="movie-title"
                    state={{ fromWatchlist: false }}
                  >
                    {movie.title}
                  </Link>
                  <p className="movie-year">{movie.release_date?.slice(0, 4)}</p>
                  <button onClick={() => addToWatchlist(movie)}>＋</button>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* WATCHLIST PAGE */
function WatchlistPage() {
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState(
    JSON.parse(localStorage.getItem("watchlist")) || []
  );

  const removeFromWatchlist = (id) => {
    const updated = watchlist.filter(m => m.id !== id);
    setWatchlist(updated);
    localStorage.setItem("watchlist", JSON.stringify(updated));
  };

  return (
    <div className="App">
      <button className="back-btn" onClick={() => navigate("/")}>
  ⬅ 
</button>
 
      <h2>📌 My Watchlist</h2>
      {watchlist.length === 0 ? (
        <p>You haven't added any movies yet 😢</p>
      ) : (
        <div className="movies-grid">
          {watchlist.map(movie => (
            <div className="movie-card watchlist-card" key={movie.id}>
              {movie.poster_path ? (
                <img src={IMAGE_PATH + movie.poster_path} alt={movie.title} />
              ) : (
                <div className="no-poster">
                  <span>{movie.title}</span>
                </div>
              )}
              <Link
                to={`/movie/${movie.id}`}
                className="movie-title"
                state={{ fromWatchlist: true }}
              >
                {movie.title}
              </Link>
              <p className="movie-year">{movie.release_date?.slice(0, 4)}</p>
              <button onClick={() => removeFromWatchlist(movie.id)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/*MOVIE DETAILS PAGE */
function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [movie, setMovie] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);

  useEffect(() => {
    // Fetch movie details
    fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`)
      .then(res => res.json())
      .then(data => setMovie(data));

    // Fetch trailer / teaser
    fetch(`https://api.themoviedb.org/3/movie/${id}/videos?api_key=${API_KEY}`)
      .then(res => res.json())
      .then(data => {
        const video =
          data.results?.find(v => v.type === "Trailer" && v.site === "YouTube") ||
          data.results?.find(v => v.type === "Teaser" && v.site === "YouTube") ||
          data.results?.find(v => v.site === "YouTube");
        if (video) setTrailerKey(video.key);
        else setTrailerKey(null);
      });
  }, [id]);

  if (!movie) return <p>Loading...</p>;

  return (
    <div className="movie-detail-page">
  {/* Back Button */}
  <button
    className="back-button"
    onClick={() => {
      if (location.state?.fromWatchlist) {
        navigate("/watchlist");
      } else {
        navigate("/");
      }
    }}
  >
    ⬅ 
  </button>

  {/* Poster */}
  <div className="poster">
    {movie.poster_path ? (
      <img src={IMAGE_PATH + movie.poster_path} alt={movie.title} />
    ) : (
      <div className="no-poster">
        <span>{movie.title}</span>
      </div>
    )}
  </div>

  {/* Info */}
  <div className="info">
    <h1>{movie.title}</h1>
    <div className="movie-stats">
      <p><span>Ratings⭐:</span> {movie.vote_average}</p>
      <p><span>Released Year📅:</span> {movie.release_date}</p>
      <p><span>Country:</span> {movie.production_countries?.map((c) => c.name).join(", ") || "N/A"}</p>
      <p><span>Genre🎬:</span> {movie.genres?.map((g) => g.name).join(", ")}</p>
    </div>
    <div className="overview">
      <h3>📖 Overview</h3>
      <p>{movie.overview}</p>
    </div>

    {/* Trailer */}
    {trailerKey ? (
      <div className="trailer-section">
        <h3>🎞 Official Trailer</h3>
        <div className="trailer-wrapper">
          <iframe
            src={`https://www.youtube.com/embed/${trailerKey}`}
            title="Movie Trailer"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    ) : (
      <p className="no-trailer">Trailer not available</p>
    )}
  </div>
</div>

  );
}




/* ROUTE */
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
