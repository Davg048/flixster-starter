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
| **Header** | App title/branding bar. | App name + tagline inside semantic `<header>` (styles in `Header.css`) | none | No |
| **SearchBar** | Lets the user type and submit a search query. | A form with text input + submit button; a "clear/back to Now Playing" control | `onSearch(query)`, `onClear`, `query` | Local only (controlled input text) |
| **SortControl** | Lets the user pick a sort order for the displayed list. | A `<select>` or buttons (e.g. Title A–Z, Release date, Rating) | `sortOption`, `onSortChange(option)` | No (lifts to App) |
| **MovieList** | Lays out the grid of movie cards (presentational as of M2). | A grid container mapping movies → MovieCard | `movies[]` | No (lifted to App in M2) |
| **MovieCard** | Displays one movie's poster + summary info. | Poster image, title, rating/release (uses `.movie-card` CSS) | `movie`, `onClick(id)` | No |
| **MovieModal** | Shows full details for the selected movie, including AI insight. | Overlay with backdrop image, title, runtime, release date, genres, overview, AI recommendation; close button | `movie` (detailed object), `onClose`, `loading`, `error` (+ `aiInsight` in M8) | No (display only) |
| **Footer** | Static footer / TMDb attribution. | Copyright + required link to themoviedb.org inside semantic `<footer>` (styles in `Footer.css`) | none | No |

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

## 4b. Visual Design (Milestone 7)

- **Theme:** cool, Apple-inspired *frosted glass* (glassmorphism). A fixed navy→indigo gradient fills the page; every panel (header, footer, cards, modal, search, sort) is a translucent, `backdrop-filter: blur()` surface floating on top.
- **Palette:** `#111844` navy · `#4B5694` indigo · `#7288AE` slate · `#EAE0CF` cream. Cream is the single accent — used only for the "Load More" button, genre tags, and keyboard focus rings so they stand out against the blues.
- **Typography:** Poppins (headings) + Inter (body), loaded via Google Fonts `@import` in `index.css`.
- **Design tokens:** all colors, fonts, blur, and radii are CSS custom properties in `:root` (`index.css`) so the palette is consistent and changeable in one place.
- **Why dark-base glass:** glass surfaces make text contrast the hard part; keeping the gradient dark guarantees light text (`--text-on-dark`) clears WCAG AA on every panel. A light-glass version would fail contrast for the cream text.
- **Accessibility:** `:focus-visible` cream ring on all interactive elements (keyboard-only, not mouse); MovieCard `<div role="button">` got an `aria-label`; semantic `<header>/<main>/<footer>` from M6; all `<img>` already carry descriptive `alt`.

### 4c. Layout & hierarchy pass ("Editorial Marquee")

A follow-up pass to fix a "plain" feeling (diagnosed as missing *hierarchy* + *material sameness*, not a color problem):
- **Brand wordmark:** two-tone "Flix**ster**" (cream `ster`), scaled up with `clamp(2.5rem, 6vw, 3.5rem)` + Poppins 700. The 🎬 is `aria-hidden` (decorative).
- **Layout:** removed `text-align:center`; content lives in a `--max-width` (1400px) `.page` column with `clamp()` side padding. Search + sort merged into one `.toolbar` row (wraps/stacks on mobile).
- **Section header:** a `Now Playing` / `Results for "<query>"` heading with a live `{count} films` and a faint cream rule, above the grid.
- **Featured tile:** the first card spans 2×2 (`grid-column/row: span 2`) with `grid-auto-flow: dense` backfilling; the span is disabled below 700px so it never overflows a narrow grid. *(A full hero banner is deferred to a later pass.)*
- **Material depth:** header uses the *stronger* glass tint to read as chrome vs. lighter content cards; cards got a real resting layered shadow (`--shadow-card`) so the grid looks alive before hover; hover lift also fires on `:focus-within` (keyboard/touch parity). Rating moved to a cream pill overlaid on the poster; titles `-webkit-line-clamp`ed to 2 lines for even heights.
- **Glow blobs:** a fixed `body::before` with two low-opacity radial gradients (indigo/slate) gives the frosted glass something to refract — the blur was nearly invisible over the smooth gradient before.
- **Tokens added:** `--space-*` scale, `--shadow-*` elevation, `--max-width`. Shadows are tokenized partly to make a future light mode a clean swap.

### 4d. Light mode — IMPLEMENTED

A "role inversion," not a literal palette flip (white glass would vanish on a pale page).
- **Tokenized first** the values that were hardcoded so the flip reaches them: `--page-gradient`, `--modal-bg`, `--modal-close-bg`, `--overlay-bg`, `--select-option-bg`, `--shadow-modal`, `--glow-1/2`, `--link`, `--focus-ring`.
- **`[data-theme='light']`** block in `index.css` overrides the *same* variable names with light values: glass tints navy (`rgba(17,24,68,...)`) so panes read darker than the page; `--text-on-dark`→navy `#111844` (~15:1), muted→deepened indigo `#3c4685` (~7.3:1); shadows navy-tinted not black; modal→near-white `rgba(252,252,253,0.85)`; option list→white.
- **Accent unchanged:** cream stays the brand in both modes (`--accent`/`--accent-text` not overridden). Focus ring + footer link flip to deep indigo so they stay visible on light.
- **Toggle:** `theme` state in `App` (lazy init: `localStorage` → `prefers-color-scheme`), an effect writes `data-theme` to `<html>` + persists to `localStorage`. `ThemeToggle` is a real `<button>` (sun/moon, `aria-pressed`, dynamic `aria-label`) in the header.
- **FOUC guard:** inline script in `index.html` sets `data-theme` before first paint so a light-mode user never sees a dark flash on reload.
- **Motion:** body theme cross-fade gated behind `prefers-reduced-motion`.
- **Contrast:** every text pairing verified ≥4.5:1 (most 7–16:1) in both themes via WCAG math.

---

## 5. AI Feature Spec (Milestone 8 — finalized before implementation)

**Framing:** Flixster is a *discovery* tool, not a viewing tool — the user is deciding **whether to go see this in theaters**, not watching it here. The AI feature is a "Worth seeing?" take that helps them choose.

### Prompt Spec
- **Role (system message):** "You are a sharp, honest film concierge helping someone decide whether to see a movie that's currently in theaters. You have not seen the film yourself; you reason only from the title, genres, and official overview provided."
- **Task:** Write a 2–3 sentence "Worth seeing?" take — who would enjoy it and what mood/occasion it suits — to help the user decide whether to catch it on the big screen.
- **Inputs:** `title` (string), `genres` (comma-separated names, e.g. "Action, Sci-Fi"), `overview` (string). Passed in the user message.
- **Output format:** plain text, 2–3 sentences, ~45 words max. No markdown, no headings, no "I" statements, no preamble like "Sure!" — just the recommendation text.
- **Constraints:** no plot spoilers beyond the official overview; no invented facts (cast, ratings, box office) not given in the inputs; no generic hype ("a must-see", "instant classic"); no comparisons to other films unless it genuinely clarifies the vibe.
- **Failure behavior:** on any error (network, rate limit/429, bad response shape) the function returns a friendly fallback string — `"We couldn't generate a recommendation for this one — check out the overview above!"` — so the modal still works. (Note: the PDF's suggested free models can be rate-limited; the fallback path is the expected behavior when that happens, not a bug.)

### Endpoint & Model
- **Endpoint:** `https://openrouter.ai/api/v1/chat/completions`
- **Model:** `meta-llama/llama-3.3-70b-instruct:free` (per the project guide)
- **Auth:** `Authorization: Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}` — key in `.env`, which is gitignored. Browser-exposed key is an accepted limitation for this learning project (would move to a backend proxy in production).

### State & Trigger
- **Owner:** **MovieModal** (revised from the original sketch that put it in App). The modal already receives the fetched `movie` details object and owns the modal's own lifecycle, so the AI state lives there too — simplest data flow, and it resets naturally when the modal unmounts on close.
- **State variables:** `aiInsight` (string | null, initial `null`) and `loadingInsight` (boolean, initial `false`).
- **Trigger:** a `useEffect` keyed on `movie?.id` (and `movie?.title`) — fires once the details are loaded, calls `getMovieInsight(title, genres, overview)`, sets `loadingInsight` true during the call, stores the result in `aiInsight`, and sets `loadingInsight` false in a `finally`.
- **Display:** below the overview, under a "✨ Worth seeing?" label. While loading, show "✨ Getting a recommendation…". Reset is automatic — closing the modal unmounts it (App clears `selectedMovieId`), so `aiInsight`/`loadingInsight` start fresh for the next movie.

### AI Feature — Decisions Log
- **What the API returned initially:** The PDF's pinned model `meta-llama/llama-3.3-70b-instruct:free` kept returning HTTP 429 ("Provider returned error" — rate limited), and two other PDF-suggested free models (`google/gemma-3-27b-it:free`, `deepseek/...:free`) now 404 as "unavailable for free." When a call did succeed, the output was good and on-spec: e.g. for *Dune: Part Two* — "Fans of epic sci-fi world-building and political intrigue will relish the sprawling desert battles… Ideal for a weekend night when you want immersive visuals and a story that rewards patience." (2 sentences, spoiler-free, names audience + occasion).
- **What I changed in my prompt:** The prompt wording itself held up well (no rewrites needed) — the framing as a "film concierge" who "hasn't seen the film" kept outputs grounded and hype-free. The real change was to the **model choice, not the prompt**: the PDF's pinned `meta-llama/llama-3.3-70b-instruct:free` was returning 429, so we switched to OpenRouter's `openrouter/free` auto-router, which picks an available free model per request and sidesteps the per-model rate limits. Also added the `HTTP-Referer` header (app attribution / rate-limit signal).
- **What fallback behavior I implemented:** A single `getMovieInsight` call to `openrouter/free` wrapped in try/catch: on any non-200 (`throw`), bad response shape, or network error, it returns a friendly string — "We couldn't generate a recommendation for this one — check out the overview above!" — so the modal still shows all the real TMDb details. A `useEffect` `ignore` flag also prevents a stale insight from a previous movie landing in the wrong modal.
- **What I learned:** Free LLM endpoints are *unreliable infrastructure*, not a fixed dependency — pinned free models get rate-limited and retired, so routing through `openrouter/free` (which auto-selects an available one) is far more robust than hardcoding a slug, and a graceful fallback is still essential. Also: in React, an async result must be guarded against the component's state having moved on (the `ignore` cleanup pattern), or you get race conditions where the wrong movie's recommendation appears.
