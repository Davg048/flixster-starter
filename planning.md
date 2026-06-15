# Flixster — Planning Spec

> First-draft spec. Edit freely — anything here is a starting point to react to, not a final decision.

---

## 1. Component Architecture

**Hierarchy**

```
App
├── Header
├── SearchBar
├── (sort control — SortControl)
├── MovieList
│   └── MovieCard (one per movie)
├── MovieModal (rendered only when a movie is selected)
└── Footer
```

| Component | Responsibility | Renders | Props received | Owns state? |
|-----------|----------------|---------|----------------|-------------|
| **App** | Top-level container; owns all shared state and data fetching. | Header, SearchBar, SortControl, MovieList, MovieModal, Footer | none | **Yes** — movie list, query, page, selected movie, sort, loading, error |
| **Header** | App title/branding bar. | App name/logo (uses `.App-header` CSS) | none (or `title`) | No |
| **SearchBar** | Lets the user type and submit a search query. | A form with text input + submit button; a "clear/back to Now Playing" control | `onSearch(query)`, `onClear`, `query` | Local only (controlled input text) |
| **SortControl** | Lets the user pick a sort order for the displayed list. | A `<select>` or buttons (e.g. Title A–Z, Release date, Rating) | `sortOption`, `onSortChange(option)` | No (lifts to App) |
| **MovieList** | Lays out the grid of movie cards (presentational as of M2). | A grid container mapping movies → MovieCard | `movies[]` | No (lifted to App in M2) |
| **MovieCard** | Displays one movie's poster + summary info. | Poster image, title, rating/release (uses `.movie-card` CSS) | `movie`, `onClick(id)` | No |
| **MovieModal** | Shows full details for the selected movie, including AI insight. | Overlay with backdrop image, title, runtime, release date, genres, overview, AI recommendation; close button | `movie` (detailed object), `onClose`, `loading`, `error` (+ `aiInsight` in M8) | No (display only) |
| **Footer** | Static footer / TMDb attribution. | Attribution text/links | none | No |

---

## 2. API Contracts

Base URL: `https://api.themoviedb.org/3`
Image base: `https://image.tmdb.org/t/p/w500` + `poster_path`
Auth: `?api_key=${import.meta.env.VITE_API_KEY}` (or Bearer token header — pick one and be consistent).

### 2a. Now Playing
- **URL:** `GET /movie/now_playing`
- **Required params:** `api_key`, `language=en-US`, `page` (for pagination / "Load More")
- **Response fields used:** `results[]` → `id`, `title`, `poster_path`, `vote_average`, `release_date`; top-level `page`, `total_pages`
- **Errors to handle:** non-200 status, empty `results`, network failure, missing `poster_path` (fallback image)

### 2b. Search
- **URL:** `GET /search/movie`
- **Required params:** `api_key`, `language=en-US`, `query` (URL-encoded), `page`
- **Response fields used:** same as Now Playing (`results[]` shape is identical)
- **Errors to handle:** empty query (don't fire request), zero results ("No movies found"), non-200, network failure

### 2c. Movie Details (for the modal)
- **URL:** `GET /movie/{movie_id}` (the movie ID is a path parameter)
- **Required params:** `api_key`, `language=en-US`
- **Response fields used:** `title`, `runtime`, `release_date`, `genres[]` (`.name`), `overview`, `backdrop_path` (+ `poster_path`, `vote_average` available)
- **Why separate:** Now Playing/Search don't return `runtime` or `genres` — the modal must fetch details by ID on card click.
- **Errors to handle:** movie not found (404), bad API key (401), network failure; show a loading state while the details fetch is in flight and a friendly message if it fails.

---

## 3. State Architecture

| State | Type | Initial | Owner | Updated by |
|-------|------|---------|-------|------------|
| `movies` | array | `[]` | App | Now Playing fetch, Search fetch, "Load More" (append), sort |
| `query` | string | `""` | App | SearchBar submit / clear. Empty string = Now Playing mode; non-empty = Search mode (doubles as the mode flag) |
| `page` | number | `1` | App | "Load More" button; reset to 1 on new search or return to Now Playing |
| `totalPages` | number | `1` | App | set from API response; used to hide/disable "Load More" on the last page |
| `selectedMovie` | object \| null | `null` | App | MovieCard click (set), modal close (null) |
| `sortOption` | string | `"none"` | App | SortControl dropdown change |
| `isLoading` | boolean | `false` | App | true before fetch, false after |
| `error` | string \| null | `null` | App | set on failed fetch, cleared on retry |
| `aiInsight` | string \| null | `null` | App | set after AI call completes (see §5) |
| `searchText` | string | `""` | SearchBar (local) | input onChange |

**Sorting decisions (Milestone 5):**
- **Where the transform happens:** *during rendering*, not in state. App keeps the raw `movies` array untouched and computes a sorted copy (`[...movies].sort(...)`) just before passing it to MovieList. This keeps the original fetch/append order intact, so switching back to "none" or loading more pages still works cleanly.
- **Sort direction per option:**
  - `title` → A→Z, using `a.title.localeCompare(b.title)`
  - `release_date` → newest first, comparing the date strings descending
  - `vote_average` → highest first, `b.vote_average - a.vote_average`
  - `none` → original API order (no sort)
- **Known tradeoff:** sorting only reorders movies *currently loaded* in state (e.g. across loaded pages), not all of TMDb. Accepted for this project.

**Divergence (Milestone 1):** This spec assigns the Now Playing fetch (and `movies` state) to **App**, but it was implemented in **MovieList**, which fetches its own data on mount. This was a deliberate choice to match the M1 instructions.

**Resolved (Milestone 2):** State lifted back up to **App** as the spec always intended. App now owns `movies`, `page`, `query`, `totalPages` and all fetch logic. `MovieList` became presentational (receives `movies` as a prop). `SearchBar` (new, sibling of MovieList) receives callbacks from App. Mode is tracked implicitly by `query`: empty string → Now Playing, non-empty → Search results.

---

## 4. Data Flow

On mount, **App** fetches `/movie/now_playing`, receives a JSON body, and stores `data.results` into `movies` state. The raw results are mostly usable as-is, but each card needs a light transform: build the full poster URL (`image base + poster_path`), handle a `null` `poster_path` with a fallback, and format `release_date` (and `vote_average` rounding) for display. `movies` is passed as a prop to **MovieList**, which maps each entry to a **MovieCard**.

When a user clicks a MovieCard, the card calls `onCardClick(movie.id)`. That ID bubbles up to App, which stores it in `selectedMovieId` state. A `useEffect` watching `selectedMovieId` fires a **second fetch** to `/movie/{id}` for full details (runtime + genres + backdrop), stores the result in `selectedMovieDetails`, and renders **MovieModal**. Closing the modal sets `selectedMovieId` back to `null`, which unmounts the modal and clears the details. So the path is: `MovieCard onCardClick(id)` → `App setSelectedMovieId(id)` → `useEffect → fetch(/movie/id)` → `setSelectedMovieDetails(details)` → modal renders; close → `setSelectedMovieId(null)`.

**Modal state ownership (M4):** App owns `selectedMovieId` (number | null — which movie's modal is open, null = closed), `selectedMovieDetails` (object | null — the fetched details), `detailsLoading` (bool), and `detailsError` (string | null). The "modal is open" condition is simply `selectedMovieId !== null`.

Searching swaps the data source: SearchBar submit sets `query`, resets `page` to 1, and App fetches `/search/movie?query=...` instead of Now Playing. Clearing the search returns to Now Playing.

---

## 5. AI Feature Spec

- **Where it displays:** inside **MovieModal**, below the overview — a short "Why you might watch this" blurb.
- **Context sent to the AI:** the selected movie's `title`, `genres` (names), and `overview`.
- **What the AI returns:** a 2–3 sentence watch recommendation written for someone deciding whether to watch.
- **State:** `aiInsight` (string | null) owned by App, passed to MovieModal as a prop; plus reuse `isLoading`/a dedicated `aiLoading` flag while the request is in flight. Reset to `null` when the modal closes or a new movie is selected.
- **Open questions to resolve at Milestone 8:** which provider/endpoint, where the call runs (the key must not leak to the browser — a serverless function or proxy may be needed), and how to handle AI errors gracefully (modal still works without the blurb).
