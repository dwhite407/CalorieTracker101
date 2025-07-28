const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

//setsup the database and creates the tables
const db = new sqlite3.Database('calorie_tracker.db');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS User (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS Summary (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            day DATE NOT NULL,
            calorie_goal INTEGER NOT NULL,
            total_calories INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES User(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS Food (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(255) NOT NULL UNIQUE,
            calories INTEGER NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS Intake (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            food_name TEXT NOT NULL,
            calories INTEGER NOT NULL,
            date TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES User(id)
        )
    `);
});

const https = require('https'); 

// Function to search food using Edamam API
async function searchFoodAPI(foodName) {
    return new Promise((resolve, reject) => {
        const appId = 'c4dcd8f2'; 
        const appKey = '85f5c18858bbeac66fef67cd5faa75cf';
        const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=${appId}&app_key=${appKey}&ingr=${encodeURIComponent(foodName)}&nutrition-type=cooking`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.parsed && result.parsed.length > 0) {
                        const food = result.parsed[0].food;
                        const calories = Math.round(food.nutrients.ENERC_KCAL || 0);
                        resolve({ name: food.label, calories });
                    } else if (result.hints && result.hints.length > 0) {
                        const food = result.hints[0].food;
                        const calories = Math.round(food.nutrients.ENERC_KCAL || 0);
                        resolve({ name: food.label, calories });
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', error => reject(error));
    });
}

//search for food via Edamam API
app.get('/search-food', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Missing query parameter' });

    try {
        const result = await searchFoodAPI(query);
        if (result) res.json(result);
        else res.status(404).json({ error: 'Food not found' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


//this is what will hold the user logins in the future
app.post('/users', (req, res) => {
    const { username, password, email } = req.body;
    db.run(
        `INSERT INTO User (username, password, email) VALUES (?, ?, ?)`,
        [username, password, email],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, username, email });
        }
    );
});

// Get all foods
app.get('/foods', (req, res) => {
    db.all(`SELECT * FROM Food`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add a new food (prevent duplicates)
app.post('/foods', (req, res) => {
    const { name, calories } = req.body;
    db.run(
        `INSERT INTO Food (name, calories) VALUES (?, ?)`,
        [name, calories],
        function (err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(400).json({ error: 'Food already exists!' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID, name, calories });
        }
    );
});

// Log a food entry (with user_id)
app.post('/intake', (req, res) => {
    const { user_id, food_name, calories } = req.body;
    const date = new Date().toISOString().split('T')[0];
    db.run(
        `INSERT INTO Intake (user_id, food_name, calories, date) VALUES (?, ?, ?, ?)`,
        [user_id || 1, food_name, calories, date], // Default user_id=1 for now
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, user_id, food_name, calories, date });
        }
    );
});

// Get intake history (per user)
app.get('/intake', (req, res) => {
    const user_id = req.query.user_id || 1; // Default to user 1 for now
    db.all(
        `SELECT * FROM Intake WHERE user_id = ? ORDER BY date DESC, id DESC`,
        [user_id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

// Clear intake history (per user)
app.delete('/intake', (req, res) => {
    const user_id = req.query.user_id || 1;
    db.run(`DELETE FROM Intake WHERE user_id = ?`, [user_id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'History cleared successfully.' });
    });
});

// Delete a food by ID
app.delete('/foods/:id', (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM Food WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) {
            return res.status(404).json({ error: "Food not found" });
        }
        res.json({ message: "Food deleted successfully" });
    });
});

//starts the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
