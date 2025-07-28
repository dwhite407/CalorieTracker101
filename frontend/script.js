//this is the url for the webpage, right now it is localhost until we publish it online
const API_URL = "http://localhost:3000";


const screens = document.querySelectorAll(".screen");
const foodInput = document.getElementById("food");
const intakeInput = document.getElementById("daily-intake");
const goalInput = document.getElementById("goal");
const goalChangeInput = document.getElementById("goal-change");
const enterButton = document.getElementById("submit");
const undoButton = document.getElementById("undo");
const clearButton = document.getElementById("clear");
const enterNewFood = document.getElementById("enter-new-food");
const clearHistoryBtn = document.getElementById("clear-history");

let foods = [];
let totalCalories = 0;
const calorieHistory = [];

//this is the navigation between the screens
function showScreen(screen) {
    screens.forEach(s => s.style.display = "none");
    document.getElementById(`${screen}-screen`).style.display = "block";

    if (screen === "history") loadHistory();
    if (screen === "foods") loadFoodsList();
}

//this is the function to change the caloric intake goal in the settings
function changeGoal() {
    const val = parseInt(goalChangeInput.value);
    if (!isNaN(val) && val > 0) {
        goalInput.value = val;
        goalChangeInput.value = "";
        showToast(`Goal set to ${val} calories`);
    } else {
        alert("Please enter a valid goal");
    }
}

//function to show the toast messages when the user inputs certain things
function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 2000);
}

//gets the foods from the database
async function fetchFoods() {
    const res = await fetch(`${API_URL}/foods`);
    foods = await res.json();
}
//gets the calories of the foods based on their names
function getCaloriesByName(name) {
    const f = foods.find(x => x.name.toLowerCase() === name.toLowerCase());
    return f ? f.calories : null;
}

//loads the foods that are able to use from the user addition, also allows for deletion of foods in list
async function loadFoodsList() {
    const res = await fetch(`${API_URL}/foods`);
    const foodsList = await res.json();
    const container = document.getElementById("foods-list");
    container.innerHTML = foodsList.length === 0 ? "No foods added yet." : "";

    foodsList.forEach(f => {
        const div = document.createElement("div");
        div.className = "food-entry";
        div.innerHTML = `
            ${f.name} - ${f.calories} cal 
            <button class="delete-food" data-id="${f.id}">Delete</button>
        `;
        container.appendChild(div);
    });

    // ✅ Attach delete events
    document.querySelectorAll(".delete-food").forEach(button => {
        button.addEventListener("click", async () => {
            if (confirm("Are you sure you want to delete this food?")) {
                await fetch(`${API_URL}/foods/${button.dataset.id}`, { method: "DELETE" });
                await fetchFoods(); 
                loadFoodsList();    
                showToast("Food deleted successfully!");
            }
        });
    });
}


//loads the history of what foods the user has eaten
async function loadHistory() {
    const res = await fetch(`${API_URL}/intake?user_id=1`);
    const history = await res.json();
    const container = document.getElementById("history-list");
    container.innerHTML = "";

    if (history.length === 0) {
        container.textContent = "No food logged yet.";
        return;
    }

    history.forEach(e => {
        const div = document.createElement("div");
        div.className = "history-entry";
        div.textContent = `${e.date}: ${e.food_name} (${e.calories} cal)`;
        container.appendChild(div);
    });
}

//event listener for the enter button
enterButton.addEventListener("click", async () => {
    const name = foodInput.value.trim();
    let cal = getCaloriesByName(name);

    if (cal !== null) {
        // ✅ Local DB food found
        logFood(name, cal);
    } else {
        // ✅ Search Edamam API automatically
        const response = await fetch(`${API_URL}/search-food?query=${encodeURIComponent(name)}`);
        if (response.ok) {
            const data = await response.json();

            // Automatically add to local DB
            await fetch(`${API_URL}/foods`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: data.name, calories: data.calories })
            });

            // Refresh local foods cache
            await fetchFoods();

            // Log the food entry immediately
            logFood(data.name, data.calories);

            showToast(`Added and logged: ${data.name} (${data.calories} cal)`);
        } else {
            alert("Food not found in local DB or Edamam API.");
        }
    }
});

// Helper function to log food
async function logFood(name, cal) {
    totalCalories += cal;
    intakeInput.value = totalCalories;
    calorieHistory.push({ food: name, calories: cal });

    await fetch(`${API_URL}/intake`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: 1, food_name: name, calories: cal })
    });

    foodInput.value = "";
    loadHistory();
}

foodInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        enterButton.click();
    }
})

//event listener for the undo button
undoButton.addEventListener("click", () => {
    if (calorieHistory.length) {
        const last = calorieHistory.pop();
        totalCalories -= last.calories;
        intakeInput.value = totalCalories;
        showToast(`Removed ${last.food} (${last.calories} cal)`);
    } else {
        alert("No entries to undo.");
    }
});

//event listener for the clear button
clearButton.addEventListener("click", () => {
    totalCalories = 0;
    intakeInput.value = 0;
    calorieHistory.length = 0;
    showToast("Daily intake cleared.");
});

//event listener for the enter new foods button
enterNewFood.addEventListener("click", async () => {
    const name = document.getElementById("new-food").value.trim();
    const cals = parseInt(document.getElementById("new-calories").value);
    if (name && !isNaN(cals)) {
        const res = await fetch(`${API_URL}/foods`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, calories: cals })
        });

        if (!res.ok) {
            const data = await res.json();
            alert(data.error || "Error adding food.");
            return;
        }

        showToast(`Added ${name} (${cals} cal)`);
        document.getElementById("new-food").value = "";
        document.getElementById("new-calories").value = "";
        fetchFoods();
        loadFoodsList();
    } else {
        alert("Enter valid food name and calories.");
    }
});

//clears the history with a button from the user intake
clearHistoryBtn.addEventListener("click", async () => {
    if (confirm("Clear all history?")) {
        await fetch(`${API_URL}/intake?user_id=1`, { method: "DELETE" });
        loadHistory();
        showToast("History cleared.");
    }
});

//initially sets the user to the home screen when loading up
window.addEventListener("DOMContentLoaded", () => {
    fetchFoods();
    showScreen("home");
});
