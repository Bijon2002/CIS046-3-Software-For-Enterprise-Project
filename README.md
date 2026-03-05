# 🍌 Apea Banana

Apea Banana is a web-based puzzle game where players solve missing-number challenges generated from the Banana API.  
The game tests logical thinking under time pressure and demonstrates modern software development concepts such as authentication, event-driven programming, interoperability with external APIs, and version control.

---

# 🎮 Game Concept

Players are presented with a mathematical puzzle image.  
The goal is to identify the missing number before the timer runs out.

Features include:

- ⏱ Timed puzzle solving
- 🧠 Logical reasoning challenges
- 🏆 Score tracking
- 📜 Attempt history
- 🌐 Integration with the Banana Puzzle API

---

# 🧩 Technologies Used

Frontend
- React
- React Router
- Axios
- Vite

Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Bcrypt password hashing

External Service
- Banana Puzzle API  
  http://marcconrad.com/uob/banana/api.php

---

# 🏗 System Architecture

The application follows a client–server architecture.


React Frontend
│
│ HTTP API Requests
▼
Node.js / Express Backend
│
├── MongoDB (users, attempts, scores)
│
└── Banana Puzzle API (external puzzle generator)


This design demonstrates interoperability between internal services and external APIs.

---

# 🔑 Key Software Engineering Concepts

## Version Control
The project is managed using Git and GitHub.  
Different features were implemented using dedicated branches such as:

- feature-auth
- feature-history
- feature-timer
- feature-ui

This workflow helps maintain clean code history and allows safe feature development.

---

## Event-Driven Programming

The game uses event-driven mechanisms including:

- Button click events
- Form submission events
- Timer countdown events
- API response handling

Example:

- The puzzle timer uses a JavaScript interval event to update the countdown every second.
- When the timer reaches zero, a new puzzle is automatically loaded.

---

## Interoperability

The system integrates with the **Banana Puzzle API**, which generates puzzle images and solutions.

Example API call:


http://marcconrad.com/uob/banana/api.php


The backend retrieves puzzle data and sends it to the frontend for display.

This demonstrates interoperability between independent software systems.

---

## Virtual Identity

User authentication is implemented using:

- Email and password login
- Password hashing with bcrypt
- JSON Web Tokens (JWT)

JWT tokens establish a virtual identity for each user and allow secure access to protected routes such as the game and attempt history.

---

# 📂 Project Structure


project-root
│
├── backend
│ ├── controllers
│ ├── models
│ ├── routes
│ ├── middleware
│ └── server.js
│
├── frontend
│ ├── src
│ │ ├── api
│ │ ├── components
│ │ ├── context
│ │ ├── pages
│ │ └── styles
│
└── README.md


---

# ⚙️ Installation

## 1️⃣ Clone the repository


git clone https://github.com/yourusername/apea-banana-game.git


---

## 2️⃣ Backend Setup


cd backend
npm install


Create a `.env` file:


PORT=5000
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key


Run backend:


npm run dev


---

## 3️⃣ Frontend Setup


cd frontend
npm install
npm run dev


Open:


http://localhost:5173


---

# 🧪 Features Implemented

✔ User registration and login  
✔ Secure authentication using JWT  
✔ Puzzle retrieval from Banana API  
✔ Timed puzzle solving  
✔ Score tracking  
✔ Attempt history  
✔ Leaderboard system  

---

# 📹 Assignment Video

The submitted video demonstrates:

- The working system
- Code structure
- Version control workflow
- Event-driven programming
- Interoperability with external APIs
- Virtual identity and authentication

---

# 👨‍💻 Author

Bijon  
BSc Software Engineering

---

# 📜 License

This project is developed for educational purposes.
