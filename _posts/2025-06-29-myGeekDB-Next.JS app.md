---
title: "geekDb: Exploring TMDB with Next.js"
date: 2025-06-29
layout: single
author_profile: true
read_time: true
share: true
related: true
tags: [React, Projects]
---

I built **geekDb** as a movie-discovery site with Next.js and [The Movie Database (TMDB)](https://www.themoviedb.org/). It gives me a way to browse trending titles, top-rated movies, and films now playing, search for a movie, and open a detail page. The interface uses React and Tailwind CSS; the catalog data comes from TMDB rather than a database I maintain.

An earlier version of this post described MongoDB, API routes, and forms for adding, editing, and deleting movies. The [linked source](https://github.com/matlesz/geekDb) has none of those. This version is a read-only catalog client built with the Next.js App Router. Correcting that distinction also makes the useful parts of the project easier to explain: server-side requests to TMDB, URL-driven browsing, and a small amount of client-side interaction.

## Browsing the catalog

The home page reads the `genre` query parameter to choose a TMDB endpoint. Despite the parameter name, these are browsing modes, not individual movie genres:

| On the site | TMDB endpoint |
| --- | --- |
| Trending | `trending/all/week` |
| Top Rated | `movie/top_rated` |
| Now Playing | `movie/now_playing` |

Trending is the default when no recognized mode is selected. The page fetches the first page of results with the API key from `API_KEY` in the server environment. Its Next.js `fetch` call sets `revalidate: 10000`, so this list can be cached and refreshed rather than requesting a new copy for every render. There is no pagination control in this version; it displays the first page returned by TMDB.

The same `Results` and `Card` components render each list. A card shows a TMDB backdrop or poster, overview, title, release date, and vote count. I used Tailwind's responsive grid classes to change the number of columns as the screen gets wider. The navigation links update `?genre=...`, and the active choice gets an underline. That lets the URL carry the browsing state without maintaining a separate client-side catalog store.

## Search and detail routes

Search is a client component because the input needs React state and a submit handler. Submitting a nonempty term navigates to `/search/[searchTerm]`; the route then requests TMDB's `search/movie` endpoint and passes the results through the same card grid. It shows an empty-results message when TMDB returns no matches. Search is **movie-only** in the current code, even though the trending endpoint can return both movies and TV shows.

Each card links to `/movie/[id]`. That route fetches `movie/{id}` from TMDB and displays a larger image, overview, release date, and average rating. The application also has an About page, a loading view, and an error view with a retry button for route errors. The TMDB key is read in the server-side page files; the search input and theme switch are the pieces that need client-side code.

For appearance, I used `next-themes` with system-theme support and a manual light/dark toggle. The theme provider wraps the layout, while Tailwind's `dark:` classes change the colors. Next.js's image component is configured for TMDB's image host, and the card and detail images use a local spinner as a blur placeholder.

## Where I would take it next

There are a few edges to fix before describing this as a complete movie and TV browser. Trending includes TV entries, but every card goes to a **movie** detail endpoint. A TV result can therefore lead to a request for a movie with the same ID instead of its TV details. I would carry the result's media type into the link and choose the matching TMDB route. I would also handle missing image paths and failed detail requests explicitly; the detail page currently assumes it received usable movie data.

The search handler inserts the typed term into the route without encoding it, so special characters and slashes deserve proper handling. Search has no paging or TV mode yet. Adding those would improve discovery before I considered accounts, saved lists, or user-written reviews. Those account features would need their own storage and authentication; neither exists in this repository. Conversely, search, light/dark switching, and revalidation are **already present**, not future features.

This project is an exercise in using the App Router to keep TMDB requests in page components and reuse the same result UI across browse and search routes. It is a catalog interface backed by an external API, not a MongoDB-backed CRUD application.

## Source and demo

- [geekDb source on GitHub](https://github.com/matlesz/geekDb)
- [Deployment link](https://geek-db.vercel.app/?genre=fetchNowPlaying)
- [Video walkthrough](https://youtu.be/V8HHf7jUuWI)
