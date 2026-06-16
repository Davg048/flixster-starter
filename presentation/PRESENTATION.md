# 🎬 Flixster — 5-Minute Demo Script

> Your speaking script + delivery coaching for the CodePath project demo.
> Matches the CodePath template: **Intro slide → Live demo → Reflection slide**.
> Total target: **5:00**. Spoken pace ≈ 140 words/min, so don't over-write — talk *with* the app, not at the slides.

---

## ⏱️ Timing budget (5:00)

| # | Slide | Time | Running total |
|---|-------|------|---------------|
| 1 | Title / Intro | 0:45 | 0:45 |
| 2 | **Live Demo** (the star) | 2:45 | 3:30 |
| 3 | Under the Hood (optional — skip if behind) | 0:45 | 4:15 |
| 4 | Reflection (Favorite / Challenging / Next) | 0:45 | 5:00 |

> If you're running long, **cut slide 3** — the demo and reflection are what matter.

---

## ✅ Pre-flight checklist (do this BEFORE you present)

This is the part most people skip and regret. Five minutes goes fast and live demos break.

- [ ] **App is already running** (`npm run dev`) and the browser tab is open to the loaded grid — never start a demo on a blank/loading screen.
- [ ] **Pre-load the page once** so the "Now Playing" movies are cached and posters are visible.
- [ ] **⚠️ Test the AI feature right before you go on.** The OpenRouter free tier can rate-limit (HTTP 429). Open a movie, confirm the "✨ Worth seeing?" blurb appears. If it's slow/failing, see the fallback plan below.
- [ ] **Have a backup**: a screen recording (Loom/QuickTime) or screenshots of the app working, in case the WiFi or API dies mid-demo.
- [ ] **Zoom your browser to ~110–125%** so the audience can read it on a projector.
- [ ] **Close other tabs / silence notifications.**
- [ ] **Fill in the blanks** in the slides: your name, pronouns, and the live URL (or say "running locally" — see note).

### 🛟 If the AI call fails live (turn the bug into a feature)
Your app handles this *gracefully by design* — that's a selling point, not an embarrassment. If the blurb shows the fallback message, say:

> "And notice — the free AI model is rate-limited right now, so instead of breaking, the app shows a friendly fallback. I built that two-layer error handling on purpose, because a real app can't assume an external API is always up."

That sentence turns a failure into evidence of good engineering. Memorize it.

### 🌐 About the live URL
The deployed-site URL (like the sample's `github.io` link) requires the **Render deployment** stretch feature, which isn't done yet. Options:
1. **Demo on localhost** — totally fine, just say "running locally."
2. **Deploy first** (we can do the Render stretch next) so you have a real link.

---

## 🖥️ SLIDE 1 — Title / Intro  *(0:45)*

**On the slide:** `🎬 Flixster` · "by [Your Name] ([pronouns])" · one-line description · a screenshot · the URL.

**Say this (≈90 words):**
> "Hi, I'm [name]. My project is **Flixster** — a movie *discovery* app. The idea: you're trying to decide what to see in theaters tonight, and Flixster helps you choose. It pulls what's **now playing** from The Movie Database API, lets you search any title, and — the part I'm most proud of — it gives you an **AI 'Worth seeing?' take** on each film so you can decide fast. It's built in **React with Vite**, and it talks to two APIs: TMDb for the movie data and OpenRouter for the AI. Let me show you."

**Delivery:** Smile, say the *problem* it solves first ("deciding what to watch"), then the stack. Don't read the bullet points — they're for the audience, not you. Then **switch to the browser.**

---

## 🖥️ SLIDE 2 — LIVE DEMO  *(2:45)*  ⭐ the main event

**On the slide:** just the word "Demo" + a fallback screenshot. All the content is what you *do* in the app. Follow this exact click order so it flows:

**Demo choreography (narrate while you click):**

1. **Land on the grid** *(15s)* — "Here's what's playing now. Notice the **featured movie** is bigger — and the whole grid is **responsive**; it reflows on any screen size." *(Optional: shrink the window once to show it reflow.)*
2. **Search** *(20s)* — Type a movie ("Dune", "Wicked", whatever's current). "I can search any title — this hits the TMDb search endpoint, and the heading and count update live."
3. **Sort** *(15s)* — Pick "Vote Average (Highest)." "I can sort the list — by rating, title, or release date."
4. **Open the modal** *(35s)* — Click a card. "Clicking a movie opens a detail view. This makes a **second API call** for the runtime, genres, and backdrop — data the list endpoint doesn't include. And here —" *(point)* "— is the **AI 'Worth seeing?'** recommendation: two or three honest sentences on who'd enjoy it. That comes from OpenRouter."
5. **Favorite + Watched** *(25s)* — Close the modal. On a couple of cards, click the **♥** and the **👁**. "I can mark movies as favorites or watched — see the rose ring and the 'Watched' badge."
6. **Sidebar** *(25s)* — Open **☰ Your Lists**. "Everything I marked shows up here in a slide-in sidebar. I can **filter the grid** to just my favorites —" *(click Filter)* "— and clear it. It even remembers a movie I favorited while searching, after I go back home."
7. **Light / dark theme** *(20s)* — Click the **☀️/🌙** toggle. "And the whole thing has a **light and dark mode** — it's an Apple-inspired frosted-glass design, and the theme switch remembers your choice."

**Delivery for the demo:**
- **Talk while you click** — silence is deadly. Narrate the *why*, not just the *what*.
- **Go slow on the AI insight and the sidebar** — those are your standout features.
- If something lags, keep talking ("while that loads…") — never go silent.
- **Watch the clock.** If you hit 3:30, wrap the demo even if you skipped a step.

---

## 🖥️ SLIDE 3 — Under the Hood  *(0:45, optional)*

**On the slide (bullets):**
- **React + Vite**, one `App` owns shared state; child components are presentational
- **Two APIs:** TMDb (movies) + OpenRouter (AI "Worth seeing?")
- **Design system:** all colors/spacing are CSS tokens → enabled a full **light/dark theme** with one override block
- **Resilient by design:** AI calls fall back gracefully; an **adversarial code review caught real bugs** (event bubbling, an async race condition, keyboard accessibility) before they shipped

**Say this (≈100 words):**
> "Quickly, under the hood: it's React with Vite. One top-level component owns the shared state and the rest are presentational — classic 'lift state up.' I put every color and spacing value into CSS variables early, which paid off hugely: adding the entire light/dark theme was basically one override block. And I leaned on **defensive engineering** — the AI feature degrades gracefully when the free API is busy, and I ran adversarial code reviews that caught subtle bugs a quick test would've missed, like a keyboard-accessibility issue and an async race condition in the modal."

**Delivery:** This is your "I'm a real engineer" slide. Keep it crisp. If short on time, **skip it** and fold one sentence into the reflection.

---

## 🖥️ SLIDE 4 — Reflection  *(0:45)*  *(matches CodePath sample slide 2)*

Three boxes: **Favorite Feature** (blue) · **Most Challenging** (green) · **Next Steps** (yellow).

| Box | Content |
|-----|---------|
| **⭐ Favorite Feature** | The **AI "Worth seeing?" insight.** It's what makes this a *discovery* tool, not just a list — and wiring an LLM into a React component with loading + fallback states taught me the most. |
| **🧗 Most Challenging** | **State that interacts.** Favorites + filters + search + sort all touch each other, and the bugs lived in the *seams* — a code review found 11 issues in the sidebar alone (an async race, keyboard focus traps). Fixing them taught me to test the non-obvious paths. |
| **🚀 Next Steps** | **Deploy to Render** for a live link · **embedded YouTube trailers** in the modal · **persist favorites** (localStorage) so they survive a reload. |

**Say this (≈95 words):**
> "To wrap up — my **favorite feature** is the AI recommendation; it's the soul of the app and taught me how to handle async AI calls with proper loading and fallback states. The **most challenging** part wasn't any single feature — it was managing state that all interacts. Favorites, filtering, search, and sort all touch each other, and the tricky bugs hid in the seams between them; a code review caught eleven issues in the sidebar alone. **Next**, I'd deploy it for a live link, embed trailers, and make favorites persist across reloads. Thanks — happy to take questions!"

**Delivery:** End on **"Next Steps"** energy — it shows you think like a builder. Land the last line, make eye contact, stop talking. Don't trail off.

---

## 🎤 General delivery tips

- **Practice the demo 2–3 times out loud** with a timer. The first run is always 90 seconds too long.
- **Don't read slides.** Slides are billboards for the audience; your voice carries the story.
- **Lead with the problem** ("deciding what to watch"), then show the solution. People remember problems.
- **Name-drop the hard parts** (async race condition, graceful fallback, accessibility) — it signals depth without being a lecture.
- **If you blank:** look at the app and describe what's on screen. The demo is your teleprompter.
- **Breathe.** 5 minutes is enough. Slow down 10%.
