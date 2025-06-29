---
title: "MyGeekDB: An IMDB-Style Android App in Kotlin"
date: 2025-06-29
layout: single
author_profile: true
read_time: true
share: true
related: true
tags: [Android, Mobile Development, Projects]
---

As part of my portfolio and continuous learning in full-stack and mobile development, I created **MyGeekDB** — an IMDB-style Android app built with Kotlin. The goal of this project was to combine clean architecture, real-time database handling, and modern Android development best practices into a lightweight but fully functional application.

---

## 📱 What Is MyGeekDB?

MyGeekDB is a simple movie catalog app that allows users to:

- Browse a list of movies (with posters and metadata)
- Add, update, and delete movies from the collection
- View individual movie details
- Store data in **Firebase Firestore**, making it scalable and real-time

---

## 🧰 Tech Stack

Here’s what powers the app:

- **Language**: Kotlin
- **Architecture**: MVVM (Model-View-ViewModel)
- **Database**: Firebase Firestore
- **UI**: Jetpack components, RecyclerView
- **Navigation**: Jetpack Navigation component
- **State Management**: LiveData & ViewModel
- **IDE**: Android Studio

---

## 🎯 Key Features

- 🔍 **Search functionality** for quick filtering
- ☁️ **Real-time database** syncing with Firebase
- ✅ **Validation and input controls** for adding/editing entries
- 🔄 **CRUD operations** (Create, Read, Update, Delete)
- 📱 **Responsive UI** for different screen sizes

---

## 🧪 What I Learned

This project helped solidify my skills in:

- Kotlin best practices and idioms
- Using Firebase as a backend-as-a-service
- Structuring Android apps using MVVM
- Managing real-time data updates with Firestore
- Improving UI/UX using Jetpack libraries

---

## 🧠 Challenges & Solutions

- **State handling** with asynchronous Firebase calls required carefully managing LiveData to avoid UI flickering.
- Handling **Firestore permissions** and avoiding reads/writes from unauthenticated users needed tight security rule management.
- I integrated simple user input validation to avoid malformed data in the database.

---

## 🚀 What's Next?

Future improvements may include:

- User authentication via Firebase Auth
- Adding reviews/ratings and sorting features
- Dark mode support
- Offline caching using Room or local database fallback

---

## 🔗 Project Repository

Check out the full source code here:  
👉 [MyGeekDB on GitHub](https://github.com/matlesz/MyGeekDB)

---

## 📹 Video Walkthrough of the project
👉 [Video](https://www.youtube.com/watch?v=EW1q2XsieC0)

This project was a stepping stone in my journey toward becoming a cybersecurity analyst with a solid understanding of system architecture, mobile ecosystems, and secure data handling. Stay tuned for more projects and blog posts!