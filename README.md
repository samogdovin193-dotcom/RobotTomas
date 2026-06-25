# 🦻 Robot Tomáš – Original Vanilla JS App

Original hearing screening and speech audiometry web application built with HTML, CSS, and vanilla JavaScript.

This project was created as part of my diploma thesis. It later served as the foundation for a modern React + TypeScript version of the application.

> Modernized migrated version: [Hearing Screening App](https://github.com/samogdovin193-dotcom/hearing-screening-app)

---

## 🚀 Features

- 🌍 Slovak and Romani language versions
- 🔊 Speech audiometry test using audio recordings
- 🖼️ Picture-card based answer selection
- 🎧 Test modes:
  - Speaker mode
  - Headphones mode (left ear/right ear)

- 🎚️ Calibration flow for test volume levels
- 📊 Results page with answer table and evaluation
- 💾 Local browser storage for test and calibration data using IndexedDB

---

## 🛠️ Tech Stack

- HTML
- CSS
- JavaScript
- IndexedDB
- localStorage

---

## 📁 Project Structure

```bash
RobotTomas/
├── sk/
│   ├── confirm_function.js
│   ├── finish.html
│   ├── finish.js
│   ├── game.html
│   ├── game.js
│   ├── home.html
│   ├── kalibracia.html
│   ├── kalibracia.js
│   ├── manual_lave_ucho.html
│   ├── manual_prave_ucho.html
│   ├── manual.html
│   ├── manual.js
│   ├── result.html
│   ├── result.js
│   ├── settings.html
│   ├── settings.js
│   ├── start_game.html
│   ├── start_game.js
│   ├── vyberkola.html
│   ├── vyberucha.html
│   ├── styles.css
│   ├── images/
│   ├── audio/
│   ├── audio_lave_ucho/
│   ├── audio_prave_ucho/
│
├── rom/
│   ├── confirm_function.js
│   ├── finish.html
│   ├── finish.js
│   ├── game.html
│   ├── game.js
│   ├── home.html
│   ├── kalibracia.html
│   ├── kalibracia.js
│   ├── manual_lave_ucho.html
│   ├── manual_prave_ucho.html
│   ├── manual.html
│   ├── manual.js
│   ├── result.html
│   ├── result.js
│   ├── settings.html
│   ├── settings.js
│   ├── start_game.html
│   ├── start_game.js
│   ├── vyberkola.html
│   ├── vyberucha.html
│   ├── styles.css
│   ├── images/
│   ├── audio/
│   ├── audio_lave_ucho/
│   ├── audio_prave_ucho/
│
└── README.md
```

---

## ⚙️ How to Run

This is a static HTML/CSS/JavaScript project.

You can run it by opening the HTML files directly in the browser, for example:

```bash
sk/home.html
```

or

```bash
rom/home.html
```

For the best experience, use a local development server such as the VS Code Live Server extension.

---

## 🌍 Language Versions

The app contains two separate language folders:

- `sk/` – Slovak version
- `rom/` – Romani version

Each version contains its own HTML pages, images, audio files, scripts, and styles.

---

## 🔄 React Migration

A newer React + TypeScript version of this project is available here:

👉 [Hearing Screening App – React Version](https://github.com/samogdovin193-dotcom/hearing-screening-app)

The React version modernizes the original app by adding:

- component-based structure
- React Router navigation
- TypeScript
- Vite build setup
- Dexie.js wrapper for IndexedDB

---

## 🎓 Project Background

This application was originally developed as part of my diploma thesis. The goal was to create an interactive tool for speech audiometry using child-friendly picture cards and audio recordings.

The original version was intentionally built with basic web technologies:

- HTML
- CSS
- JavaScript

The later React version was created as a modernization and portfolio improvement of the original project.

---

## 👨‍💻 Author

Built by Ing. Samuel Gdovin.
A frontend developer focused on learning React through real-world projects.

---

## 📄 License

This project is for educational purposes.
