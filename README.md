# Installation
To use the Calorie Tracker application, users can choose between cloud access or a local setup.

# Cloud Setup:
The frontend is deployed on Netlify and the backend is hosted via Render API. This method is easiest and requires only one step:

STEP 1:
Open the following link in your browser:  https://idyllic-boba-1fb1bb.netlify.app/

Note: The application is hosted on free services, so it may take 10–15 seconds for all features to load. A good indicator that the app is ready is the History page — if it says 'No food logged yet,' the app is functioning properly.

# Local Setup:
To run the application locally, follow these steps:

1. Open the 'script.js' file in the 'frontend' folder and change the API URL at the top from:
   const API_URL = "https://calorietracker101-1.onrender.com";
   to:
   const API_URL = "http://localhost:3000";
   Save the file after making this change.

2. Open a command prompt and clone the project repository using:
   git clone https://github.com/dwhite407/CalorieTracker101.git

3. Navigate to the 'backend' directory using one of the following methods:
   - Option 1: Use File Explorer to locate the cloned folder, right-click the 'backend' folder, and select 'Copy as path'. Then use:
     cd "Your\Copied\Path\Here"
   - Option 2: Type the relative path into the terminal from your user directory. Example:
     cd Downloads/calorietrack/CalorieTracker101-main/backend
     (Note: Use forward slashes in this case.)

4. Once in the backend directory, run the following commands:
   npm install
   node server.js
   Wait for confirmation: 'server running on port 3000'

5. Open the 'index.html' file in the 'frontend' folder using your browser to launch the app locally.


# Tech Stack

Backend: Node.js, Express, SQLite3 Frontend: HTML, CSS, JavaScript Database: SQLite
