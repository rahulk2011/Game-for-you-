# 🎮 Multiplayer Truth or Dare — Sibling Showdown

> **A fast, real-time multiplayer "Truth or Dare" mobile web game built specifically for siblings.**  
> Create a private 5-character room on your phone, send an instant invite link to your brother or sister, and play head-to-head with sub-100ms synchronization—zero refreshes, zero frameworks, pure web standards.

---

## ✨ Features

- ⚡ **Real-Time Firebase Syncing (`< 100ms`)**  
  Powered by Firebase Realtime Database (`onValue` listeners), every room state transition—joining the lobby, drawing a Truth or Dare, and passing the turn—updates instantaneously across both devices without reloading the page.

- 🔗 **One-Tap Shareable Room Links (`?room=ABCDE`)**  
  Clicking **Create Game** generates a unique 5-character alphanumeric room code under `rooms/<room_code>` and builds a direct invite URL. Player 1 can tap **Copy Invite Link** (with an instant `"Copied!"` toast notification), and when Player 2 opens the link, they are automatically joined into the room and the game begins immediately.

- 🌙 **Strict Premium Dark Mode UI**  
  Engineered with a mobile-first aesthetic featuring deep midnight blues, obsidian surfaces, glassmorphism cards (`backdrop-filter: blur(18px)`), smooth `0.3s ease-in-out` transitions, tactile button states, and a glowing active turn indicator.

- 🎯 **Enforced Turn-Based Gameplay**  
  Clearly highlights whose turn it is (`"Your Turn!"` vs. `"Waiting for other player..."`) and automatically disables the **Truth** and **Dare** buttons when it is not the local player's turn.

- 😂 **60 Sibling-Friendly Prompts (30 Truths + 30 Dares)**  
  Pre-loaded with a curated deck of clean, hilarious, and relatable prompts designed for a brother-sister dynamic—from confessing who broke something in the house to speaking in a funny accent for the next 3 rounds.

- 🔊 **Synthesized Web Audio Feedback**  
  Built-in zero-dependency Web Audio API sound effects for button taps, prompt reveals, and sibling room joins, complete with an in-game Mute/Unmute toggle.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Markup** | ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white) **HTML5** | Semantic, accessible mobile-first structure (`index.html`) |
| **Styling** | ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) **CSS3** | Custom properties, Flexbox/Grid, glassmorphism, and glowing turn states (`style.css`) |
| **Logic** | ![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black) **Vanilla JS (ES6+)** | Modular state machine, URL parameter parsing, and DOM rendering (`script.js`) |
| **Backend & Sync** | ![Firebase](https://img.shields.io/badge/Firebase-Realtime_DB-FFCA28?style=flat-square&logo=firebase&logoColor=black) **Firebase Realtime Database** | Real-time room state tree (`rooms/<room_code>`) and `onValue` listeners |

---

## 🕹️ How to Play

1. **Create a Room (Player 1 — Host)**  
   Open the app on your smartphone and tap **Create Game**. A 5-character room code (e.g., `K9X4M`) is generated and pushed to Firebase with `game_status: "waiting"`.
2. **Invite Your Sibling (Player 2 — Guest)**  
   Tap **Copy Invite Link** and send the URL (`index.html?room=K9X4M`) to your sibling via text/WhatsApp—or have them enter the 5-character code directly on their screen.
3. **Automatic Game Start**  
   As soon as Player 2 opens the link, `player2_connected` flips to `true`, `game_status` switches to `"playing"`, and the game arena opens on both phones automatically.
4. **Pick Truth or Dare**  
   On your turn, the turn banner glows with **"Your Turn!"**. Tap **Truth** or **Dare** to randomly draw a prompt and display it boldly on both screens at the exact same moment.
5. **Pass the Turn**  
   Once the Truth is answered or the Dare is completed, tap **Next Turn** to clear the board and flip `current_turn` to your sibling.

---

## 🚀 Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/multiplayer-truth-or-dare.git
cd multiplayer-truth-or-dare
```

### 2. Project File Structure

```text
multiplayer-truth-or-dare/
├── index.html       # Semantic HTML5 layout (Setup, Lobby, and Game Arena views)
├── style.css        # Strict Dark Mode stylesheet, glassmorphism, and responsive rules
├── script.js        # Firebase Realtime Database sync, turn engine, and 60 prompts
└── README.md        # Project documentation
```

### 3. Configure Firebase Realtime Database

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. In the left sidebar, navigate to **Build → Realtime Database** and click **Create Database**.
3. Copy your project's Web SDK configuration keys from **Project Settings → General → Your apps**.
4. Open **`script.js`** and paste your credentials into the **`firebaseConfig`** block at the very top of the file:

```javascript
/* ============================================================================
 * 1. FIREBASE CONFIGURATION BLOCK
 * Paste your Firebase project keys below. Ensure Realtime Database is enabled
 * in your Firebase Console and `databaseURL` points to your RTDB instance.
 * ============================================================================ */
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Firebase Realtime Database Data Schema

Each active room is stored under `rooms/<room_code>` with the following real-time structure:

```json
{
  "rooms": {
    "K9X4M": {
      "player1_connected": true,
      "player2_connected": true,
      "current_turn": "player1",
      "game_status": "playing",
      "current_question": {
        "type": "truth",
        "text": "Did you ever break something in the house and blame it on me?"
      },
      "round_number": 1,
      "updated_at": 1762250000000
    }
  }
}
```

### 5. Run Locally

Because `script.js` uses native ES6 modules (`<script type="module">`), serve the directory over a local HTTP server:

```bash
# Using Vite / npm (if using the bundled workspace)
npm install
npm run dev

# Or using Python's built-in HTTP server
python3 -m http.server 3000

# Or using VS Code Live Server extension
# Right-click index.html -> "Open with Live Server"
```

Open `http://localhost:3000` in two mobile browsers (or two tabs) to start playing!

---

## 📄 License

Distributed under the **Apache-2.0 / MIT License**. Built with ❤️ for sibling rivalries everywhere.
