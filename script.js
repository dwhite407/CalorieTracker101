//this dictionary holds the calories and food names 
const calorieData = {
    "chicken": 200,
    "apple": 2500,
    "pizza": 2501
};

const foodInput = document.getElementById("food");
const intakeInput = document.getElementById("daily-intake");
const goalInput = document.getElementById("goal");

const enterButton = document.getElementById("submit");
const clearButton = document.getElementById("clear");

const addFood = document.getElementById("new-food");
const addCalories = document.getElementById("new-calories");

const enterNewFood = document.getElementById("enter-new-food");

//initializes the calorie count for the daily intake
let totalCalories = 0;

//function for listening for the enter button click
enterButton.addEventListener("click", () => {
    const foodName = foodInput.value.toLowerCase().trim();

    if(calorieData[foodName] !== undefined){
        totalCalories += calorieData[foodName];
        intakeInput.value = totalCalories;
    }

    //updates the background depening on the amount of calories (red if over goal)
    updateBackground();
    foodInput.value = ""; //resets the food value input box
})

//function for listening for inputs and buttons for new food with its calorie count
enterNewFood.addEventListener("click", () =>{
    let name = addFood.value.toLowerCase().trim();
    let calories = addCalories.value.trim();
    const caloriesNum = +calories;

    //this logic only allows the add button to be counted for when there is a name and a positive calorie count. 
    if (name !== "" && !isNaN(calories) && caloriesNum > 0) {
        calorieData[name] = +calories;
        showToast(`Added "${name}" with ${calories} calories.`);
    } else {
        showToast("Please enter a food name and a positive calorie number.");
    }

    addFood.value = "";
    addCalories.value = "";
})

//function for listening for clear button click
clearButton.addEventListener("click", () => {
    totalCalories = 0; //clears calorie variable
    intakeInput.value = totalCalories;
    intakeInput.style.background = "rgb(112, 184, 236)";
    foodInput.value = "";//clears value box again
})

//function to update the background based on relation to the goal
function updateBackground() {
    const intakeVal = +intakeInput.value;
    const goalVal = +goalInput.value;

    //logic for checking relation of the goal to daily intake
    if (intakeVal > goalVal) {
        intakeInput.style.background = "rgb(255, 18, 18)";
    } else if (intakeVal === goalVal) {
        intakeInput.style.background = "rgb(129, 227, 104)";
    } else {
        intakeInput.style.background = "rgb(112, 184, 236)";
    }
}

//handles keyboard key presses for better user experience
foodInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const typedValue = foodInput.value.toLowerCase().trim();

        if(typedValue === "clear"){
            clearButton.click(); //allows the user to type in clear then press enter instead of having to click the button
        } else {
            enterButton.click(); //press enter to add the food to the calorie count
        }
    }
});

//when a user hits enter after typing the food it will bring their cursor to calorie box
addFood.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        addCalories.focus(); //this is where it focuses the cursor
    }
})
 
//when a user hits enter after calories, it adds the food to the dictionary
addCalories.addEventListener("keydown", (event) => {
    if (event.key === "Enter"){
        enterNewFood.click();
    }
})

//this is the function to handle the showToast instead of using alert, better for user experience
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000); //toast message disappears after 2 seconds
}


