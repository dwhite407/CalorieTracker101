# CalorieTracker101


🥗 Calorie Tracker App

A simple web application to log daily food intake, track calories, and manage a personal food list.
Built with Node.js, Express, SQLite3, HTML, CSS, and JavaScript.

📌 Features

Set and update your daily calorie goal
Log foods you eat and see current calorie intake
Add new foods with calorie values
View and clear your history of logged foods
Simple, user-friendly interface
🚀 Getting Started

1️⃣ Prerequisites
Node.js (v14+ recommended)
npm (comes with Node.js)
SQLite3
2️⃣ Installation
# Clone this repository
git clone https://github.com/your-username/calorie-tracker.git

# Go into the project folder
cd calorie-tracker

# Install dependencies
npm install
3️⃣ Database Setup
You can use the provided SQLite database (calorie_tracker.db) or create a fresh one:

sqlite3 calorie_tracker.db < calorie_tracker_tables.sql
4️⃣ Run the App
npm start
The server will start on 

🛠️ Tech Stack

Backend: Node.js, Express, SQLite3
Frontend: HTML, CSS, JavaScript
Database: SQLite
📂 Project Structure

├── server.js              # Backend server
├── script.js              # Frontend logic
├── Index.html             # Main page
├── styles.css             # Styling
├── calorie_tracker.db     # SQLite database
├── calorie_tracker_tables.sql  # SQL schema
├── package.json
└── package-lock.json
