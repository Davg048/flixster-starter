# Flixster — Milestone Walkthroughs

> A teaching log of the whole project, milestone by milestone. For each one:
> **(1)** a detailed code walkthrough, **(2)** the most critical parts, **(3)** the
> part students find hardest and why, and **(4)** two explanations — one for a
> total beginner, one for a developer.
>
> **How to read this file:** open it in Cursor and press `Cmd+Shift+V` for a
> rendered preview, or view it on GitHub. To turn it into a Google Doc, paste the
> rendered version in, or run it through any Markdown→Docs converter.

## Contents
- [The architecture in one picture](#the-architecture-in-one-picture)
- [Milestone 0 — Project Setup & the Spec](#milestone-0--project-setup--the-spec)
- [Milestone 1 — MovieCard, MovieList & the Now Playing grid](#milestone-1--moviecard-movielist--the-now-playing-grid)
- [Milestone 2 — Search, Load More & the Now Playing/Search toggle](#milestone-2--search-load-more--the-now-playingsearch-toggle)
- [Milestone 3 — Responsive grid](#milestone-3--responsive-grid)
- [Milestone 4 — MovieModal & the details fetch](#milestone-4--moviemodal--the-details-fetch)
- [Milestone 5 — Sorting](#milestone-5--sorting)
- [Milestone 6 — Header & Footer](#milestone-6--header--footer)
- [Milestone 7 — Visual design: glassmorphism, hierarchy & accessibility](#milestone-7--visual-design-glassmorphism-hierarchy--accessibility)
- [Milestone 8 — AI "Worth seeing?" insight (+ light mode)](#milestone-8--ai-worth-seeing-insight--light-mode)
- [Stretch — Favorites & Watched](#stretch--favorites--watched)
- [Stretch — Sidebar (lists & grid filter)](#stretch--sidebar-lists--grid-filter)
- [Stretch — Embedded trailers](#stretch--embedded-trailers)
- [Cross-cutting lessons](#cross-cutting-lessons)

---

## The architecture in one picture

```
App (owns ALL shared state + data fetching)
├── Header ──────── wordmark + ThemeToggle
├── <main>
│   ├── toolbar ── SearchBar + SortControl
│   ├── section header ("Now Playing" / "Results for …" + live count)
│   ├── MovieList ── maps movies → MovieCard (first card = featured 2×2)
│   ├── Load More button (page < totalPages)
│   └── MovieModal (only when a movie is selected)
│        └── fetches its own AI "Worth seeing?" insight
└── Footer ──────── copyright + TMDb attribution
```

**The one idea that explains the whole app:** `App` is the single owner of shared
state (`movies`, `query`, `page`, `totalPages`, `sortOption`, `selectedMovieId`, …).
Children are mostly **presentational** — they receive data as props and call
callbacks back up. This is React's "lifting state up" pattern, and almost every
milestone is an exercise in applying it.

---

## Milestone 0 — Project Setup & the Spec

*Commit: `1f8d831` (planning.md added) · Files: `planning.md`, `.env`, `.gitignore`*

### 1. Detailed code walkthrough
Milestone 0 produces almost no *code* — it produces a **plan**. The deliverable is
`planning.md`, a spec with five sections: Component Architecture, API Contracts,
State Architecture, Data Flow, and an AI-feature sketch. The other setup steps:
- The TMDb key lives in `.env` as `VITE_API_KEY=...`. Vite only exposes env vars
  prefixed with `VITE_` to browser code via `import.meta.env`.
- `.env` is listed in `.gitignore` so the key never reaches GitHub.

### 2. Critical highlights
The spec is the most valuable artifact in the whole project. Every later milestone
opens by checking `planning.md` ("does my state architecture already cover this?").
Writing the contract *before* the code is what stops you from discovering structure
mid-build.

### 3. The "Student Challenge" perspective
The hardest thing here is psychological: it feels like busywork to write a spec when
you "could just start coding." Students skip it, then hit Milestone 4 and realize
they have no idea where the selected-movie ID should live. The spec is a map you
draw *before* you're lost, not after.

### 4. Dual explanations
- **Beginner:** Before building a house you draw blueprints — where the rooms go,
  where the plumbing runs. `planning.md` is the blueprint for the app: what pieces
  exist, what data they need, and how they connect. The `.env` file is a locked
  drawer for your secret key so it never gets posted publicly.
- **Developer:** M0 establishes a project-level spec (component contracts, API
  contracts, state ownership, data-flow) and secrets hygiene (`VITE_`-scoped env
  var, gitignored). It front-loads architectural decisions so implementation is
  execution against a contract rather than discovery.

---

## Milestone 1 — MovieCard, MovieList & the Now Playing grid

*Commit: `1f8d831` · Files: `MovieCard.jsx/.css`, `MovieList.jsx/.css`, `App.jsx`*

### 1. Detailed code walkthrough
Two new components:
- **`MovieList`** maps over a `movies` array and renders one `MovieCard` per movie:
  ```jsx
  {movies.map((movie) => (
    <MovieCard key={movie.id} movie={movie} onClick={onCardClick} />
  ))}
  ```
  The `key={movie.id}` is React's identity hint — it lets React track which card is
  which across re-renders (essential once we add/remove movies).
- **`MovieCard`** receives one `movie` and renders its poster, title, and rating.
  The poster URL is built from a base + `poster_path`, with a fallback when the
  path is `null`:
  ```jsx
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/movie.png'
  ```

**Architectural note (a deliberate divergence, logged in `planning.md`):** the spec
said `App` owns the Now Playing fetch, but in M1 the fetch was first implemented
*inside* `MovieList`. That was matched to the M1 instructions, then **lifted back up
to `App` in M2** as the spec intended. Documenting that divergence is itself a
lesson: specs are living documents.

### 2. Critical highlights
- **The `key` prop.** Without a stable key, React can't tell list items apart and
  will mis-update the DOM when the list changes. `movie.id` is the right key.
- **The poster fallback.** Real API data is messy — some movies have no poster.
  Handling `null` here prevents broken `<img>` tags later.

### 3. The "Student Challenge" perspective
The toughest concept is **`.map()` returning JSX**. Students are comfortable with
`.map()` transforming numbers, but "an array of movie objects → an array of
`<MovieCard>` elements" is a leap. The follow-on confusion is *why* each needs a
`key` and why the console screams without one.

### 4. Dual explanations
- **Beginner:** `MovieList` is like a stamp machine: hand it a stack of movie facts
  and it stamps out one little card for each. Each card knows how to draw a poster,
  a title, and a star rating. If a movie is missing its poster, we show a
  placeholder instead of a broken image.
- **Developer:** A presentational `MovieList` renders `movies.map()` → keyed
  `MovieCard` children; `MovieCard` derives its poster URL from `poster_path` with a
  null-guard fallback. Data fetching initially lived in `MovieList` (M1) and was
  lifted to `App` in M2 per the spec.

---

## Milestone 2 — Search, Load More & the Now Playing/Search toggle

*Code landed in commit `9f85d20` (bundled with M4) · Files: `SearchBar.jsx/.css`, `App.jsx`*
*Note: there is no standalone "M2" commit — this work was committed together with the modal.*

### 1. Detailed code walkthrough
This milestone makes the app interactive. Three capabilities, all coordinated by
state in `App`:

- **A unified fetch function** that handles both modes via one `query` param:
  ```js
  const baseUrl = searchQuery
    ? `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(searchQuery)}`
    : `https://api.themoviedb.org/3/movie/now_playing?`
  ```
  Empty `query` = Now Playing; non-empty = Search. The `query` string *doubles as
  the mode flag* — no separate "mode" variable needed.

- **Load More (pagination)** appends instead of replacing:
  ```js
  setMovies((prev) => pageToFetch === 1 ? data.results : [...prev, ...data.results])
  ```
  Page 1 replaces (fresh search); later pages spread the old array plus the new
  results. The button only shows while `page < totalPages`.

- **`SearchBar`** is a *controlled component* — React owns the input value:
  ```jsx
  <input value={searchText} onChange={(e) => setSearchText(e.target.value)} />
  ```
  It keeps its own local `searchText`, but submitting/clearing calls callbacks
  (`onSearch`, `onClear`) up to `App`.

### 2. Critical highlights
- **`query` as the single source of truth for mode.** One string controls which
  endpoint is hit *and* what the section header says. Fewer state variables =
  fewer ways to get out of sync.
- **The functional `setMovies(prev => …)` form.** Appending must read the *latest*
  array; passing a function guarantees you're not appending to a stale snapshot.
- **`encodeURIComponent(searchQuery)`** — search text can contain spaces/`&`/etc.;
  encoding makes it a safe URL.

### 3. The "Student Challenge" perspective
The classic trap is **`setMovies([...movies, ...new])` using the stale `movies`**
instead of the functional updater. It often *looks* fine until rapid clicks reveal
dropped pages. The deeper hurdle is the **mental model of controlled inputs**:
"the input doesn't store its own text — React does, and the input just reflects
state." That inversion confuses nearly everyone at first.

### 4. Dual explanations
- **Beginner:** The search box is like a walkie-talkie that reports every keystroke
  back to headquarters (`App`), and `App` decides what movies to show. "Load More"
  doesn't reload the page — it asks for the *next* batch and tacks it onto the end
  of the list you already have, like adding pages to a binder.
- **Developer:** `App` owns `movies`/`query`/`page`/`totalPages`. A single
  `fetchMovies(page, query)` switches endpoints on `query` (which doubles as the
  mode flag), appends via the functional `setMovies` updater for pagination, and
  resets to page 1 on new search/clear. `SearchBar` is a controlled component
  lifting submit/clear callbacks to `App`.

---

## Milestone 3 — Responsive grid

*Commit: `a0415ff` · Files: `MovieList.css`*

### 1. Detailed code walkthrough
A pure-CSS milestone. The grid auto-fits columns and changes density at breakpoints:
```css
.movie-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
@media (max-width: 1023px) { /* tablet: minmax(160px,1fr) */ }
@media (max-width: 600px)  { /* mobile: repeat(2, 1fr) — exactly 2 columns */ }
```
- `auto-fill` + `minmax(200px, 1fr)` = "fit as many ~200px columns as will fit, then
  stretch them to share the row." The browser computes the column count for you.
- The breakpoints shrink the minimum card width on tablet, then force exactly two
  columns on phones so cards never get too tiny.

### 2. Critical highlights
`repeat(auto-fill, minmax(MIN, 1fr))` is the single most important line — it's
responsive *without any media query at all*. The breakpoints are refinements on top
of an already-fluid base. The plan (how many columns at each width) was written as a
comment *before* the CSS — implement-against-a-target, not chase-a-feeling.

### 3. The "Student Challenge" perspective
`minmax()` and `auto-fill` vs `auto-fit` are genuinely confusing. Students reach for
a stack of media queries (one per screen size) when one `auto-fill` line does 90% of
the job. Understanding that the browser is doing the column math for you is the
unlock.

### 4. Dual explanations
- **Beginner:** Instead of telling the page "always show 4 movies per row," we tell
  it "make each movie about 200px wide and fit as many as you can." On a wide screen
  that's six per row; on a phone it wraps down to two. The layout rearranges itself.
- **Developer:** A fluid CSS Grid (`auto-fill` + `minmax`) provides intrinsic
  responsiveness; two `@media` breakpoints adjust the track minimum (tablet) and pin
  a 2-column layout (mobile) for legibility.

---

## Milestone 4 — MovieModal & the details fetch

*Commit: `9f85d20` · Files: `MovieModal.jsx/.css`, `App.jsx`, `MovieCard.jsx`, `MovieList.jsx`*

### 1. Detailed code walkthrough
Clicking a card opens a modal with **extra data that requires a second API call**
(the Now Playing/Search responses don't include `runtime` or `genres`).

The data path (all coordinated by `App`):
1. `MovieCard` calls `onClick(movie.id)` → bubbles up to `App`.
2. `App` stores it: `setSelectedMovieId(id)`.
3. A `useEffect` watching `selectedMovieId` fires the details fetch:
   ```js
   useEffect(() => {
     if (selectedMovieId === null) return
     // fetch /movie/{id}, setSelectedMovieDetails(data), handle loading + errors
   }, [selectedMovieId])
   ```
4. `MovieModal` renders with the fetched details, a loading state, and an error
   state.
5. Closing sets `selectedMovieId` back to `null`, which unmounts the modal and
   clears details.

The modal also handles closing three ways: an ✕ button, clicking the dark overlay,
and pressing **Escape** (via a `keydown` listener added/removed in a `useEffect`).
The `e.stopPropagation()` on the inner box stops inside-clicks from bubbling to the
overlay's close handler.

### 2. Critical highlights
- **`useEffect` keyed on `selectedMovieId`.** This is the heart: state change →
  effect → fetch. Understanding "effects react to dependency changes" is the M4
  payoff.
- **Three states rendered explicitly:** loading, error, and success. Real network
  code is never just "the happy path."
- **`stopPropagation` + overlay click.** A small but classic pattern for "click
  outside to close."

### 3. The "Student Challenge" perspective
**Why a *second* fetch?** Students assume the movie object they already have is
complete — then can't find `runtime`/`genres` and get stuck. Realizing different
endpoints return different shapes, and that the modal must fetch *by id*, is the
conceptual core. Right behind it: the **effect cleanup** for the Escape listener
(add on mount, remove on unmount) trips people who forget the cleanup and stack
duplicate listeners.

### 4. Dual explanations
- **Beginner:** The grid shows a movie's "trading card" info. Click it and we phone
  the database *again* for the full dossier — runtime, genres, a big backdrop — and
  show it in a pop-up. While we wait, you see "Loading…"; if the call fails, you see
  a friendly message instead of a broken box. Click the ✕, the dark area, or press
  Escape to close.
- **Developer:** Card click lifts `movie.id` to `App` (`selectedMovieId`); a
  `useEffect([selectedMovieId])` performs the `/movie/{id}` details fetch with
  loading/error states into `selectedMovieDetails`. `MovieModal` is presentational
  (renders details/loading/error). Close = set id `null` (unmount + cleanup).
  Dismissal via button, overlay click (with inner `stopPropagation`), and an
  Escape `keydown` listener registered/torn-down in an effect.

---

## Milestone 5 — Sorting

*Commit: `7d3e71d` · Files: `SortControl.jsx/.css`, `App.jsx`*

### 1. Detailed code walkthrough
A dropdown re-orders the current list. The key design decision: **sort during
render, not in state.** `App` keeps the raw `movies` untouched and computes a sorted
*copy* just before passing it down:
```js
const sortedMovies = [...movies].sort((a, b) => {
  if (sortOption === 'title')        return a.title.localeCompare(b.title)
  if (sortOption === 'release_date') return b.release_date.localeCompare(a.release_date) // newest first
  if (sortOption === 'vote_average') return b.vote_average - a.vote_average             // highest first
  return 0 // 'none' = original order
})
```
- `[...movies]` makes a **copy** — `.sort()` mutates in place, and mutating state
  directly is a React anti-pattern.
- `localeCompare` for strings; subtraction for numbers; reversed operands for
  descending.
- `SortControl` is a controlled `<select>` lifting `onSortChange` to `App`.

### 2. Critical highlights
- **Sorting a copy, never the original.** Keeping raw `movies` intact means
  switching back to "none" or loading more pages still works cleanly. This is the
  whole architectural choice of the milestone.
- **Comparator direction.** `b - a` vs `a - b` (and reversed `localeCompare`) is how
  you flip ascending/descending — a tiny detail with big visible effect.

### 3. The "Student Challenge" perspective
Two traps: (1) **`.sort()` mutating in place** — students sort `movies` directly,
corrupt their own state, and get weird bugs. (2) **comparator logic** — remembering
that the function returns negative/zero/positive and which order that produces is
perennially fiddly. Known tradeoff worth understanding: client-side sort only
reorders movies *currently loaded*, not all of TMDb.

### 4. Dual explanations
- **Beginner:** The dropdown is like re-alphabetizing a shelf of DVDs you already
  pulled out — it rearranges what's in front of you, not the whole store. We always
  sort a *photocopy* of the list so the original order is never lost.
- **Developer:** `sortOption` state in `App` drives a derived `[...movies].sort()`
  computed at render (non-mutating), with per-option comparators (localeCompare /
  numeric, ascending/descending). `SortControl` is a controlled select. Sort is a
  pure view transform over loaded data — an accepted client-side-only tradeoff.

---

## Milestone 6 — Header & Footer

*Commit: `dd5f7bd` · Files: `Header.jsx/.css`, `Footer.jsx/.css`, `App.jsx`, `App.css`*

### 1. Detailed code walkthrough
Two stateless presentational components wrapped in semantic landmarks:
- **`Header`** → semantic `<header>` with the app title.
- **`Footer`** → semantic `<footer>` with copyright + the **required** TMDb
  attribution link. Uses `{new Date().getFullYear()}` so the year never goes stale,
  and `rel="noopener noreferrer"` on the external `target="_blank"` link.
- **`App`** renders `<Header />`, wraps content in `<main>`, and `<Footer />` —
  giving a proper `<header>/<main>/<footer>` document structure.
- **Cleanup:** the old `.App-header` rule was *deleted* from `App.css` and moved to
  `Header.css` so there's one source of truth (plain CSS imports are global, so
  duplicate selectors across files silently conflict).

### 2. Critical highlights
- **Removing the duplicate `.App-header` rule.** Two definitions of the same
  selector in different files fight via import order — a confusing, invisible bug.
  One source of truth fixes it.
- **Semantic landmarks** (`<header>/<main>/<footer>`) — free accessibility wins that
  also pre-satisfy Milestone 7's structure requirement.

### 3. The "Student Challenge" perspective
The surprise here isn't the JSX (it's trivial) — it's learning that **plain CSS
imports are global, not scoped to the component.** Students assume `import
'./Header.css'` isolates those styles; it doesn't, so a duplicated class name in
another file silently overrides theirs and they can't see why.

### 4. Dual explanations
- **Beginner:** We added a title bar on top and a fine-print bar on the bottom — like
  a newspaper's masthead and footer. The footer credits the movie database we borrow
  data from (politely required). We also removed an old duplicate styling instruction
  so there's only one set of rules for the header.
- **Developer:** Two pure presentational components in semantic landmark elements;
  footer carries TMDb attribution and a self-maintaining copyright year with a
  safe external-link `rel`. Resolved a global-namespace `.App-header` collision by
  consolidating the rule into `Header.css`.

---

## Milestone 7 — Visual design: glassmorphism, hierarchy & accessibility

*Commit: `ee1e602` · Files: `index.css`, all component CSS, `Header.jsx`, `MovieCard.jsx`, `MovieList.jsx`*

This milestone happened in two passes: a **glassmorphism theme + accessibility**
pass, then an **"editorial layout" pass** to fix a "feels plain" critique.

### 1. Detailed code walkthrough
- **Design tokens.** Every color, font, blur, radius, shadow, and spacing value
  became a CSS custom property in `:root` (`index.css`). Components reference
  `var(--…)` instead of hardcoded values — one source of truth for the whole look.
- **Glassmorphism recipe** (on every panel): translucent fill + `backdrop-filter:
  blur()` + a 1px translucent border, over a fixed navy→indigo gradient.
- **Glow blobs:** a fixed `body::before` with two soft radial gradients gives the
  blur something to refract (glass over a smooth gradient looks like nothing).
- **Accessibility:** `:focus-visible` ring (keyboard-only, not mouse), `aria-label`
  on the `div[role="button"]` cards, `alt` on all images, semantic structure.
- **Editorial pass (fixing "plain"):** removed `text-align:center`; added a
  max-width content column; merged search+sort into one toolbar; added a "Now
  Playing / Results for …" section header with a **live count**; made the **first
  card a featured 2×2 tile** (`grid-column/row: span 2` + `grid-auto-flow: dense`,
  guarded off below 700px); tiered the glass (stronger on chrome) and gave cards a
  real resting shadow; two-tone **"Flix·ster"** wordmark with `clamp()` display
  sizing; rating moved to a pill on the poster.

### 2. Critical highlights
- **CSS custom properties as a design system.** This single decision is what makes
  light mode (M8) a variable-swap instead of a rewrite, and what keeps new UI
  on-brand for free.
- **The featured-tile media-query guard.** A 2×2 span on a 2-column phone grid
  overflows; the `max-width: 699px` reset is what keeps it from breaking on mobile.
- **`:focus-visible`** — the difference between a site that *looks* fine and one
  keyboard users can actually navigate.

### 3. The "Student Challenge" perspective
`backdrop-filter` has four sneaky gotchas: it blurs what's *behind* (not the element),
needs a *translucent* background, needs *something behind it* to blur, and needs the
`-webkit-` prefix for Safari. Beginners hit "it doesn't work" and can't tell which of
the four is the cause. The runner-up: confusing `:hover` / `:focus` / `:focus-visible`
as the same thing.

### 4. Dual explanations
- **Beginner:** We painted the whole app a cool twilight blue and turned every panel
  into frosted glass floating in front of it. We wrote all the colors on one "recipe
  card" so the whole mood can change by editing four lines. Then we gave the page a
  lead actor (a big featured movie tile), a confident title, and made sure
  keyboard-only users can see where they are.
- **Developer:** A token-based design system (`:root` custom properties) drives a
  glassmorphism treatment (translucent fill + `backdrop-filter` + hairline border)
  over a fixed gradient with radial "glow" backdrops for refraction. The editorial
  pass introduced hierarchy (display wordmark via `clamp()`, a labeled section with
  live count, a `span 2/2` featured grid item with `grid-auto-flow: dense` guarded
  below 700px) and material tiers. A11y: `:focus-visible` rings, `aria-label` on the
  composite `role=button` card, semantic landmarks.

---

## Milestone 8 — AI "Worth seeing?" insight (+ light mode)

*Commit: `65baedc` · Files: `MovieModal.jsx/.css`, `ThemeToggle.jsx/.css`, `App.jsx`, `index.css`, `index.html`*

This commit bundled two features: the **AI insight** (the milestone proper) and
**light mode** (a self-directed extra).

### 1. Detailed code walkthrough

**AI insight** (in `MovieModal`):
- A `getMovieInsight(title, genres, overview)` helper calls OpenRouter's
  `openrouter/free` auto-router (which picks an available free model, sidestepping
  per-model rate limits), wrapped in `try/catch` returning a friendly fallback
  string on *any* failure.
- Two state atoms in the modal: `aiInsight` and `loadingInsight`.
- A `useEffect` keyed on `movie?.id` fires the call once details load, with an
  **`ignore` flag** in the cleanup to prevent a slow response from a previous movie
  landing in the wrong modal (the async race-condition guard).
- Displayed under a "✨ Worth seeing?" label, with a pulsing loading line
  (disabled under `prefers-reduced-motion`).
- The prompt was written as a committed spec in `planning.md` *first* — framing the
  AI as a "film concierge" helping you decide whether to see it in theaters
  (discovery, not viewing).

**Light mode** (`data-theme` + `ThemeToggle`):
- A `[data-theme='light']` block in `index.css` overrides the *same* token names
  with light values — a "role inversion," not a literal flip: glass tints navy
  (not white) so panels stay visible; text flips dark; shadows go navy-tinted.
- Hardcoded values (modal bg, overlay, gradient, shadows, options, links) were
  **tokenized first** so the flip actually reaches them.
- `theme` state in `App` (lazy init: localStorage → `prefers-color-scheme`); an
  effect writes `data-theme` to `<html>` and persists it.
- An inline **FOUC guard** in `index.html` sets the theme before first paint (no
  dark flash on reload).
- The cream brand accent stays the same in both modes; focus ring + links darken in
  light mode for visibility.

### 2. Critical highlights
- **Two-layer graceful failure** (AI). The `try/catch` → fallback means a 429 or
  network blip shows a friendly line, never a broken modal. Verified live under real
  rate limits.
- **The `ignore` race guard.** Async + React's number-one footgun: a late response
  setting state on a changed/unmounted modal. The per-effect `ignore` flag fixes it.
- **Tokenize-before-theming.** Light mode only works because the hardcoded colors
  were converted to variables first — otherwise the modal stays dark while the rest
  flips.
- **FOUC guard.** Sets the theme before React mounts, so light-mode users never see
  a dark flash.

### 3. The "Student Challenge" perspective
The hardest concept is the **async-in-`useEffect` race condition** — and most
students don't know they have the bug, because it only shows when you click around
quickly. The `ignore`-flag-in-cleanup pattern requires understanding closures *and*
the effect lifecycle simultaneously. For light mode, the trap is assuming a *literal*
palette inversion works (white glass vanishes on a light background) and that
`data-theme` belongs on a React `<div>` rather than `<html>` (it must be at/above
`:root` to override the cascade).

### 4. Dual explanations
- **Beginner:** Open a movie and the app quietly asks an AI, "in 2–3 honest
  sentences, who'd enjoy seeing this in theaters?" If the AI is busy or fails, you
  get a polite "couldn't generate one" and the rest of the pop-up still works. We
  also added a sun/moon switch for light vs dark — and because all our colors live on
  one recipe card, flipping the theme just hands the app a different card. It even
  remembers your choice and matches your computer's setting the first time.
- **Developer:** `MovieModal` owns `aiInsight`/`loadingInsight`; a `useEffect`
  keyed on `movie?.id` calls `getMovieInsight` (OpenRouter `openrouter/free`,
  `try/catch` → fallback), guarded by an `ignore` cleanup flag against stale
  responses. The prompt is a committed spec. Light mode is a `data-theme` attribute
  on `documentElement` overriding `:root` custom properties (role inversion: navy
  glass tint, dark text, navy shadows); hardcoded surfaces were tokenized first;
  `theme` state lazy-inits from localStorage→`prefers-color-scheme` and reflects to
  `<html>`; an inline IIFE in `index.html` prevents FOUC. Cream accent invariant;
  focus ring/links darken in light. All theming verified WCAG AA in both modes.

---

## Stretch — Favorites & Watched

*Files: `App.jsx`, `MovieList.jsx`, `MovieCard.jsx/.css`, `index.css`*

Two features built together because they're **one pattern applied twice**: a
per-card toggle whose on/off state lives in `App` and visually marks the card.
Intentionally **not persisted** — they reset on reload (per the spec).

### 1. Detailed code walkthrough
- **State in `App`:** two `Set`s of movie IDs (`favorites`, `watched`). A `Set`
  gives O(1) `has(id)` membership checks (run for every card on every render) and
  can't hold duplicates. Created with a lazy initializer `useState(() => new Set())`.
- **Toggle = copy-on-write:** the updater builds a `new Set(prev)`, adds/deletes
  the id, and returns it. The *new identity* is what tells React to re-render —
  mutating the old Set in place would be invisible to React's bail-out check.
- **Prop chain:** `App` → `MovieList` (computes `favorites.has(movie.id)` per card)
  → `MovieCard` (renders two `aria-pressed` buttons + applies `is-favorite`/
  `is-watched` classes).
- **The bubbling fix:** the buttons live inside the card, which is itself a
  clickable "open modal" element. `handleToggle` calls `e.stopPropagation()` so a
  click on the heart/eye doesn't *also* open the modal.
- **Visual marking (CSS):** favorited = rose inset ring; watched = dimmed poster +
  a "WATCHED" ribbon via `::after`. Buttons are top-left frosted chips (rating pill
  owns top-right).

### 2. Critical highlights
- **`e.stopPropagation()`** — without it, every favorite click also opens the modal.
- **Copy-then-return Set** — without a new reference, the UI never updates.
- **Adversarial review caught real bugs before commit** (see below).

### 3. The "Student Challenge" perspective
Two classic traps: **event bubbling inside a clickable container** (clicking the
heart mysteriously opens the modal, because DOM events flow child→parent), and
**"why won't my Set re-render?"** (mutating state in place produces the same
reference, so React skips the repaint). Both are invisible at a glance and only
surface at runtime — which is exactly why this feature got an adversarial review.

### 4. Dual explanations
- **Beginner:** Each card gets a heart and an eye. The heart outlines the card in
  rose; the eye dims the poster and adds a "WATCHED" badge. The tricky bit: those
  buttons sit on a card that's already a big "click to open details" button, so I
  had to stop their clicks from leaking through. Marks reset on reload (intended).
- **Developer:** Two `Set<number>` in `App`, toggled copy-on-write for referential
  change; `MovieList` derives per-card booleans and forwards callbacks; `MovieCard`
  renders `aria-pressed` buttons with `stopPropagation` (click) + a keydown guard,
  driving conditional `is-favorite`/`is-watched` classes. Ephemeral by design.

### What the adversarial review caught (and how it was fixed)
Before committing, an automated adversarial review attacked this feature across
event-handling, state-identity, a11y, and edge-case lenses, verifying each finding
against the real code. It surfaced **3 genuine bugs** my first pass missed:

1. **(HIGH) Keyboard opened the modal unintentionally.** `stopPropagation()` only
   covered the *click* — pressing Enter/Space on a focused heart/eye button let the
   *keydown* bubble to the card's `onKeyDown`, opening the modal too. **Fix:** guard
   the card handler with `if (e.target !== e.currentTarget) return` so it only acts
   when the card *itself* is focused, plus `preventDefault()` for Space.
2. **(HIGH) Active heart lost contrast over bright posters.** The chip was only 70%
   opaque, so a light poster showed through and the rose heart dropped to ~2.34:1
   (below the 3:1 minimum). **Fix:** a near-opaque `--chip-bg` token (92%) — pushes
   the heart back to ~5.3:1 regardless of poster.
3. **(LOW) Chip color wasn't tokenized**, breaking the theme-system contract.
   **Fix:** the same `--chip-bg` token, now used by both the rating pill and action
   buttons.

**The lesson:** the two HIGH bugs were *runtime* and *accessibility* issues
invisible in a code skim — a build passing and "it works when I click with a mouse"
would have hidden both. Reviewing against the actual failure modes (keyboard,
contrast) is what caught them.

---

## Stretch — Sidebar (lists & grid filter)

*Files: `Sidebar.jsx/.css`, `App.jsx`, `App.css`*

A slide-in drawer listing your Favorites + Watched movies, with buttons to filter
the main grid by either list. Builds directly on the Favorites/Watched feature.

### 1. Detailed code walkthrough
- **The registry (`moviesById`).** The key insight: `favorites`/`watched` only
  store *IDs*, but the sidebar needs full movie *objects* — and a movie you
  favorited in Search results isn't in the current Now Playing `movies` array.
  So `App` keeps a `Map` of every fetched movie (accumulated inside `fetchMovies`),
  and resolves `favoriteMovies = [...favorites].map(id => moviesById.get(id))`.
- **One source of truth for the filtered grid.** When a filter is active, the
  grid draws from the *same* registry-backed `favoriteMovies`/`watchedMovies`
  arrays the sidebar uses (not the current view) — so the grid and sidebar can
  never disagree.
- **`Sidebar`** is a drawer that stays in the DOM and slides via an `.is-open`
  class (so it animates both ways). Each list row opens the movie's modal.
- **Filter state** (`filterMode`: `'all' | 'favorites' | 'watched'`) narrows the
  grid; an on-grid "Clear filter" button and several auto-resets prevent dead-ends.

### 2. Critical highlights
- **The `moviesById` registry** — without it, favoriting in Search then switching
  to Now Playing would make the favorite *vanish* from the sidebar.
- **Resolving the filtered grid from the registry, not the view** — the single
  change that makes the grid and sidebar consistent.
- **Drawer accessibility** (focus management, `inert`, Escape) — see below.

### 3. The "Student Challenge" perspective
Two hard parts. (1) **The view/registry split:** beginners filter the grid against
the *current* `movies` array, which works in the demo but strands the grid empty
the moment you switch views — a bug that only appears through a specific sequence
of actions. (2) **Drawer accessibility:** a drawer that's visually hidden with
`transform: translateX(100%)` is still *in the DOM and Tab-focusable* — so keyboard
users tab into an invisible panel. Making it truly inert, managing focus on
open/close, and wiring Escape are all easy to forget and invisible to a
mouse-only test.

### 4. Dual explanations
- **Beginner:** A slide-out panel on the right lists your hearted and watched
  movies, and can filter the main grid to just those. The clever bit: we keep a
  little address book of every movie we've ever loaded, so your favorites never
  disappear even if you favorited them while searching and then went back home.
- **Developer:** A `moviesById` Map registry decouples the favorite/watched ID
  Sets from object availability across views; filtered grid and sidebar both
  resolve from it (single source of truth). `Sidebar` is a token-themed drawer
  with imperative `inert` toggling (React 18 doesn't forward the JSX prop),
  open/close focus management via a `[isOpen]`-keyed effect (with `onClose` held
  in a ref to avoid re-run churn), and Escape-to-close mirroring the modal.

### What the adversarial review caught (and how it was fixed)
This feature touched far more interacting state, and the review surfaced **11
confirmed issues** (several overlapping), in two clusters:

**Cluster A — filter/view desync (HIGH):** the grid filtered the *current view*
while the sidebar used the *global registry*, so they disagreed; switching views
or unfavoriting the last item could strand the grid empty with no escape. **Fixed**
by resolving the filtered grid from the same registry-backed lists, resetting
`filterMode` on search/clear, an auto-reset effect when a filter empties, and an
on-grid "Clear filter" button.

**Cluster B — drawer accessibility (HIGH):** the closed drawer kept focusable
buttons in the tab order (focus trap + an `aria-hidden`-on-focusable violation);
focus didn't move in on open or return on close; Escape didn't close it. **Fixed**
with imperative `inert` (React 18 doesn't forward the prop), focus-in on open,
focus-return on close, and an Escape handler.

**A bug the fix itself introduced** (caught on re-verification): because `onClose`
is a fresh closure each render, the focus effect re-ran while open and overwrote
the captured trigger with the in-drawer close button — so focus would return to an
*inert* element. **Re-fixed** by holding `onClose` in a ref and capturing the
trigger in a local `const`, so the effect keys on `[isOpen]` alone.

**The lesson:** the more pieces of state interact, the more the bugs live in the
*seams between features* (filter × search × sort × pagination) and in the
*non-mouse* paths (keyboard, focus) — none of which a passing build or a quick
mouse test reveals.

---

## Stretch — Embedded trailers

*Files: `MovieModal.jsx/.css`*

A YouTube trailer embedded in the movie modal, fetched from TMDb's videos
endpoint. This one was deliberately built to *mirror the AI-insight pattern* —
same shape, so it was low-risk.

### 1. Detailed code walkthrough
- **`getMovieTrailer(id)`** fetches `/movie/{id}/videos`, then picks the best clip
  by **preference order**: an *official* YouTube "Trailer" → any YouTube Trailer →
  any YouTube Teaser. Returns the video `key` or `null`. Wrapped in try/catch so
  any failure returns `null` (the section just hides — no broken UI).
- **State + effect:** a `trailerKey` state and a `useEffect` keyed on `movie?.id`,
  with the same `ignore` race-guard and a `setTrailerKey(null)` reset at the start
  (so the previous movie's trailer doesn't flash while the new one loads).
- **Display:** `{trailerKey && (<iframe .../>)}` — a YouTube embed
  (`youtube.com/embed/{key}`) in a 16:9 wrapper (`aspect-ratio: 16/9`), only
  rendered when a trailer exists. A `key={trailerKey}` forces a fresh iframe per
  trailer so a swapped `src` can never reuse a stale (autoplaying) video.

### 2. Critical highlights
- **The preference-order pick** — TMDb returns many videos (featurettes, clips,
  teasers); choosing the official trailer first is what makes it feel curated.
- **Graceful absence** — many movies have no trailer; returning `null` and
  hiding the section (vs. an empty player) is the right default.
- **`key={trailerKey}` on the iframe** — guarantees the embed remounts per movie.

### 3. The "Student Challenge" perspective
The conceptual trap is **iframe reuse across renders**: React reconciliation will
happily keep the same `<iframe>` DOM node and just swap its `src` when you open a
different movie — which can leave the *previous* trailer briefly playing (even with
audio). The fix (`key` prop to force a remount) is invisible until you experience
the bug. The runner-up is realizing the videos endpoint is a *separate* call with
its own messy data (you must filter by `site === 'YouTube'` and `type`).

### 4. Dual explanations
- **Beginner:** When you open a movie, the app asks the database "got a trailer?"
  and, if so, drops a real YouTube player right into the pop-up. If there's no
  trailer, it just shows nothing rather than an empty box.
- **Developer:** A `getMovieTrailer` helper hits TMDb's videos endpoint and
  resolves the best YouTube key via a typed preference cascade; a `[movie?.id]`
  effect with an `ignore` guard + null-reset populates `trailerKey`, rendered as a
  conditionally-mounted, `aspect-ratio`-boxed YouTube `<iframe>` keyed by trailer
  to force remounts. Verified with a focused review (race, null-handling, iframe
  reuse).

---

## Cross-cutting lessons

These themes recur across every milestone — they're the real curriculum:

1. **Lift state up.** `App` owns shared state; children receive props and call
   callbacks up. Almost every feature is an application of this.
2. **Spec before code.** `planning.md` is checked at the start of each milestone.
   Architecture decided deliberately beats architecture discovered mid-build.
3. **Design tokens beat magic numbers.** CSS custom properties in `:root` turned
   "restyle the app" and "add a whole light mode" into edits in *one* place.
4. **Never mutate state directly.** Copy-then-transform (`[...movies].sort()`) keeps
   React's model predictable.
5. **Handle the unhappy path.** Loading states, error states, null fallbacks, and
   graceful AI fallbacks — real data and real APIs fail, and the UI must not.
6. **Async needs guards in React.** The `useEffect` `ignore` flag (and effect
   cleanup generally) prevents stale-response and duplicate-listener bugs.
7. **Accessibility is a design constraint, not an afterthought.** Semantic
   landmarks, `alt` text, keyboard handlers, visible focus rings, and verified
   contrast were built in, not bolted on.
