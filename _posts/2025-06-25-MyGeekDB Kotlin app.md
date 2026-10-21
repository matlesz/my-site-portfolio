---
title: "MyGeekDB: A Kotlin Movie and TV App"
date: 2025-06-29
layout: portfolio_article
author_profile: true
read_time: true
share: true
related: true
tags: [Android, Mobile Development, Projects]
---

I built **MyGeekDB** to explore Android development with Kotlin. The app brings movie and TV information into one place: I can browse recommendations, search for something specific, open its details, and save favorites to my account. The screen is built with Jetpack Compose, movie and series information comes from TMDB, and Firebase handles sign-in and the data tied to each user.

That distinction matters. An earlier description of the project made it sound like Firestore was the movie database and users could add or edit catalog entries. Looking at the code, neither is how this version works. TMDB supplies the catalog; Firestore stores profiles and favorites. The add-and-remove flow applies to favorites, not to the movies themselves.

## Finding something to watch

The home screen has separate movie and TV sections. `MovieViewModel` requests movie recommendations from TMDB, while `SeriesViewModel` loads popular TV series. The app reads titles, overviews, posters, vote averages, vote counts, and popularity from the responses. Poster images are loaded into Compose components with Coil.

Search has the same split. When I type a query, the movie view model calls TMDB's movie-search endpoint; the series view model uses its TV-search endpoint. The home screen lets me switch which type I am searching. Selecting a result opens a detail screen with its poster, overview, and rating information. There is a fallback image when a TMDB result has no poster.

This was a useful part of building the app because the UI has to handle two kinds of media without pretending they are the same Kotlin model. `Movie` and `Series` each carry their own fields, and the screens decide which details to show for the item I selected.

## Favorites belong to the signed-in user

I used Firebase Authentication for email/password accounts and Google Sign-In. The login flow also includes registration and a password-reset request. Once signed in, the user's ID determines where favorites are stored in Firestore:

```text
users/{uid}/favoriteMovies/{movieId}
users/{uid}/favoriteSeries/{seriesId}
```

Tapping a favorite control updates the list held by the view model and writes the change to the corresponding Firestore document. The view models also listen for changes to those collections, so saved favorites can flow back into the UI. In the favorites screen, I can switch between movies and series and swipe an item away to remove it. This is different from editing TMDB's catalog: the saved item is a copy of the movie or series information associated with my account.

The repository README includes example Firestore rules that restrict access to a user's own documents. The app code also checks for a current Firebase user before it reads or writes favorites. Those are important boundaries for account data, although the repository alone cannot tell me whether the same rules are deployed in a particular Firebase project.

## Putting Compose and Firebase together

MyGeekDB uses MVVM: the view models do the network and Firestore work, and the Compose screens observe their `LiveData`. `MainActivity` sets up the Compose UI, while the home screen manages the drawer, search, media tabs, details, and favorites. I used Material 3 components for the interface. The app's theme already follows the device's light or dark setting, with dynamic colors on supported Android versions.

Profile editing is another place where the pieces meet. A signed-in user can change their display name and pick a profile image. The image-upload path writes the file to Firebase Storage, obtains its download URL, then updates the profile record. That is more involved than a local form field: the UI has to wait for the upload and show an error if it fails.

The hardest part for me was keeping asynchronous work and UI state understandable. A Firestore listener can update favorites after a network change, while TMDB search results arrive on a different path. Keeping those results in view models and observing them from Compose gave me a clearer place to handle updates than putting every request directly inside a screen.

## What I would improve

There are rough edges in this version. In the home screen, the search-loading flag is cleared immediately after an asynchronous search starts, before the response necessarily arrives. I would tie that flag to the request's completion so it reflects what the screen is actually waiting for. The movie-recommendations request also uses a fixed TMDB account identifier in the code; I would revisit that before treating recommendations as personal to each signed-in user.

The features I originally listed as future work still include reviews, ratings written by users, sorting, and offline caching with Room or another local store. TMDB ratings are already *displayed*, which is not the same as letting someone write a review. Authentication and system-driven dark mode are already in the code, so they do not belong on the future-features list.

Building MyGeekDB helped me practice Kotlin, Compose state, and the boundary between a public catalog API and private, account-specific data. The linked repository shows the implementation; the walkthrough shows the app's screens.

## Code and walkthrough

- [MyGeekDB source on GitHub](https://github.com/matlesz/MyGeekDB)
- [Video walkthrough](https://www.youtube.com/watch?v=EW1q2XsieC0)
