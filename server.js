const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

const db = new sqlite3.Database('calorie_tracker.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS User(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Summary(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        day DATE NOT NULL,
        calorie_goal INTEGER NOT NULL,
        total_calories INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES User(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Food(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        calories INTEGER NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Summary_Details(
        summary_id INTEGER NOT NULL,
        food_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        PRIMARY KEY (summary_id, food_id),
        FOREIGN KEY (summary_id) REFERENCES Summary(id),
        FOREIGN KEY (food_id) REFERENCES Food(id)
    )`);

    db.run("INSERT OR IGNORE INTO User (id, username, password, email) VALUES (1, 'default', 'password', 'default@email.com')");
});

// Function to search food using Edamam Food Database API
async function searchFoodAPI(foodName) {
    return new Promise((resolve, reject) => {
        const appId = 'demo'; // Using demo credentials - replace with your own
        const appKey = 'demo';
        const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=${appId}&app_key=${appKey}&ingr=${encodeURIComponent(foodName)}&nutrition-type=cooking`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (result.parsed && result.parsed.length > 0) {
                        const food = result.parsed[0].food;
                        const calories = Math.round(food.nutrients.ENERC_KCAL || 0);
                        resolve({ name: food.label, calories: calories });
                    } else if (result.hints && result.hints.length > 0) {
                        const food = result.hints[0].food;
                        const calories = Math.round(food.nutrients.ENERC_KCAL || 0);
                        resolve({ name: food.label, calories: calories });
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

app.get('/api/foods', (req, res) => {
    db.all("SELECT * FROM Food", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        const foodDict = {};
        rows.forEach(row => {
            foodDict[row.name] = row.calories;
        });
        res.json(foodDict);
    });
});

app.post('/api/search-food', async (req, res) => {
    const { foodName } = req.body;
    
    try {
        // First check if food exists in local database
        db.get("SELECT * FROM Food WHERE name = ?", [foodName.toLowerCase()], async (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (row) {
                // Food found in local database
                res.json({ name: row.name, calories: row.calories, source: 'local' });
            } else {
                try {
                    // Search using food API
                    const apiResult = await searchFoodAPI(foodName);
                    
                    if (apiResult) {
                        // Save to local database for future use
                        db.run("INSERT OR REPLACE INTO Food (name, calories) VALUES (?, ?)", 
                            [foodName.toLowerCase(), apiResult.calories], function(err) {
                            if (err) {
                                console.error('Error saving to database:', err);
                            }
                        });
                        
                        res.json({ 
                            name: foodName.toLowerCase(), 
                            calories: apiResult.calories, 
                            source: 'api',
                            apiName: apiResult.name 
                        });
                    } else {
                        res.json({ error: 'Food not found' });
                    }
                } catch (apiError) {
                    console.error('API Error:', apiError);
                    res.json({ error: 'Food not found' });
                }
            }
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

app.post('/api/foods', (req, res) => {
    const { name, calories } = req.body;
    
    db.run("INSERT OR REPLACE INTO Food (name, calories) VALUES (?, ?)", [name.toLowerCase(), calories], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, id: this.lastID });
    });
});

app.post('/api/log-food', (req, res) => {
    const { foodName, calories, goal } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const userId = 1;

    db.get("SELECT id, total_calories FROM Summary WHERE user_id = ? AND day = ?", [userId, today], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (row) {
            const newTotal = row.total_calories + calories;
            db.run("UPDATE Summary SET total_calories = ? WHERE id = ?", [newTotal, row.id], (err) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ success: true, totalCalories: newTotal });
            });
        } else {
            db.run("INSERT INTO Summary (user_id, day, calorie_goal, total_calories) VALUES (?, ?, ?, ?)", 
                [userId, today, goal, calories], function(err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json({ success: true, totalCalories: calories });
            });
        }
    });
});

app.get('/api/history', (req, res) => {
    const userId = 1;
    
    db.all("SELECT day, calorie_goal, total_calories FROM Summary WHERE user_id = ? ORDER BY day DESC", [userId], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/today', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const userId = 1;
    
    db.get("SELECT total_calories FROM Summary WHERE user_id = ? AND day = ?", [userId, today], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ totalCalories: row ? row.total_calories : 0 });
    });
});

app.post('/api/clear-today', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const userId = 1;
    
    db.run("UPDATE Summary SET total_calories = 0 WHERE user_id = ? AND day = ?", [userId, today], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
