# 🍌 Banana Brain Quest 🧠

![Banana Brain Quest](https://img.shields.io/badge/Status-Active-brightgreen.svg) ![License](https://img.shields.io/badge/License-MIT-blue.svg)

Welcome to **Banana Brain Quest**, a premium, competitive math puzzle game built with a stunning jungle/gold glassmorphism aesthetic! Test your pattern recognition, compete against friends in real-time, and climb the ranks from *Novice* to *Banana God*!

---

## ✨ Features

### 🎮 **Stunning Game Modes**
* **Solo Arcade Console**: A breathtaking, unified glassmorphism dashboard. Face infinite puzzles, race against the timer, and try to beat your high score.
* **Real-Time Multiplayer**: Compete head-to-head against other players! Features a synchronized timer, live VS dashboard, and instant win/loss condition tracking via Socket.io.

### 🏆 **Deep Gamification & Progression**
* **XP & Ranking System**: Earn XP for solving puzzles and completing objectives. Level up through 10 distinct ranks (e.g., Novice, Adept, Master, Grandmaster).
* **Cherries & Lives**: Earn *Cherries* 🍒 by completing objectives or playing daily. Spend them mid-game to buy extra lives (Brains 🧠) and save your run!
* **Badges & Achievements**: Unlock unique badges for reaching milestones like "First Win" or "Speed Demon".

### 📊 **Competitive Tracking**
* **Global Leaderboards**: See where you rank among all players.
* **Match History**: Review details of your past multiplayer and singleplayer matches in a dedicated dashboard.

### 🎨 **Premium UI/UX**
* **Glassmorphism Aesthetic**: Beautiful transparent cards, dynamic glowing gradients, and floating intuitive interfaces.
* **Custom Avatars**: Dynamically generated avatars via the DiceBear API or custom emojis.
* **First-Time Tutorial**: LocalStorage powered "How to Play" modal ensuring new players grasp the mechanics immediately.

---

## 🛠️ Technology Stack

* **Frontend**: React.js, Vite, React Router, Socket.io-client
* **Backend**: Node.js, Express, Socket.io, JWT for robust Authentication
* **Styling**: Custom CSS3 with dynamic variables and Flexbox/CSS Grid layouts

---

## 🚀 Getting Started

To run the game locally, you will need to start both the backend server and the frontend client.

### Prerequisites
* Node.js (v16 or higher recommended)
* NPM or Yarn

### 1. Start the Backend
```bash
cd backend
npm install
npm run dev
```

### 2. Start the Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

The game should now be running on `http://localhost:5173`!

---

## 🎯 How to Play

1. Choose a difficulty (Easy, Medium, Hard).
2. Look at the visual puzzle and figure out the missing single digit (`0-9`).
3. Enter your answer and smack the **🦍 GO BANANAS!** button.
4. Don't run out of lives (🧠) and beat the timer (⏱) if playing on Medium/Hard! 

## 📝 License
This project is licensed under the MIT License.
