// server.js

// Import necessary modules
const express =
require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors"); // For enabling Cross-Origin Resource Sharing
// Initialize the Express application
const app = express();
const PORT = process.env.PORT || 3000; // Port for the server to listen on
const TASKS_FILE_PATH = path.join(__dirname, "tasks.json"); // Path to the JSON file acting as a database

// --- Middleware --- //
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// Enable CORS for all routes, allowing your frontend to make requests
app.use(cors());
// Parse incoming JSON requests (e.g., when adding a new task)
app.use(express.json());

// --- Helper Functions for File Operations ---

/**
 * Reads tasks from the tasks.json file.
 * @returns {Promise<Array>} A promise that resolves with an array of tasks.
 */
const readTasksFromFile = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(TASKS_FILE_PATH, "utf8", (err, data) => {
      if (err) {
        // If the file doesn't exist or other read error, assume no tasks yet
        if (err.code === "ENOENT") {
          return resolve([]); // Return empty array if file not found
        }
        return reject(err); // Other errors
      }
      try {
        const tasks = JSON.parse(data);
        resolve(tasks);
      } catch (parseError) {
        console.error("Error parsing tasks.json:", parseError);
        resolve([]); // If JSON is corrupt, return empty array to prevent crash
      }
    });
  });
};

/**
 * Writes tasks to the tasks.json file.
 * @param {Array} tasks - The array of tasks to write.
 * @returns {Promise<void>} A promise that resolves when writing is complete.
 */
const writeTasksToFile = (tasks) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(
      TASKS_FILE_PATH,
      JSON.stringify(tasks, null, 2),
      "utf8",
      (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      }
    );
  });
};

// --- API Endpoints ---

// GET /api/tasks - Retrieve all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await readTasksFromFile();
    res.json(tasks);
  } catch (error) {
    console.error("Error reading tasks:", error);
    res.status(500).json({ message: "Failed to retrieve tasks." });
  }
});

// POST /api/tasks - Add a new task
app.post("/api/tasks", async (req, res) => {
  try {
    const tasks = await readTasksFromFile();
    const newTask = {
      id: "task-" + Date.now(), // Generate a unique ID
      text: req.body.text,
      details: req.body.details || "", // Optional details
      status: req.body.status || "todo", // Default status
    };

    if (!newTask.text) {
      return res.status(400).json({ message: "Task text is required." });
    }

    tasks.push(newTask);
    await writeTasksToFile(tasks);
    res.status(201).json(newTask); // Respond with the created task
  } catch (error) {
    console.error("Error adding task:", error);
    res.status(500).json({ message: "Failed to add task." });
  }
});

// PUT /api/tasks/:id - Update an existing task (e.g., change its status)

app.put("/api/tasks/:id", async (req, res) => {
  try {
    const tasks = await readTasksFromFile();
    const taskId = req.params.id;
    const taskIndex = tasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      return res.status(404).json({ message: "Task not found." });
    }

    // Update task properties
    if (req.body.status) {
      tasks[taskIndex].status = req.body.status;
    }
    if (typeof req.body.text !== "undefined") {
      tasks[taskIndex].text = req.body.text;
    }
    if (typeof req.body.details !== "undefined") {
      tasks[taskIndex].details = req.body.details;
    }

    await writeTasksToFile(tasks);
    res.json(tasks[taskIndex]);
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Failed to update task." });
  }
});





//app.put("/api/tasks/:id", async (req, res) => {
//  try {
//    const tasks = await readTasksFromFile();
//    const taskId = req.params.id;
//    const taskIndex = tasks.findIndex((task) => task.id === taskId);
//
//    if (taskIndex === -1) {
//      return res.status(404).json({ message: "Task not found." });
//    }

    // Update task properties. Only status is expected for now, but can be extended.
//    if (req.body.status) {
//      tasks[taskIndex].status = req.body.status;
//    }
//    if (typeof req.body.text !== "undefined") {
//      tasks[taskIndex].text = req.body.text;
//    }
//    if (typeof req.body.details !== "undefined") {
//      tasks[taskIndex].details = req.body.details;
//    }
//
//    await writeTasksToFile(tasks);
//    res.json(tasks[taskIndex]); // Respond with the updated task
//  } catch (error) {
//          console.error("Error updating task:", error);
//    res.status(500).json({ message: "Failed to update task." });
//  }
//});





// DELETE /api/tasks/:id - Delete a task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    let tasks = await readTasksFromFile();
    const taskId = req.params.id;
    const initialLength = tasks.length;
    tasks = tasks.filter((task) => task.id !== taskId);

    if (tasks.length === initialLength) {
      return res.status(404).json({ message: "Task not found." });
    }

    await writeTasksToFile(tasks);
    res.status(200).json({ message: "Task deleted successfully." });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Failed to delete task." });
  }
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Todo task API server listening on http://localhost:${PORT}`);
  // Ensure tasks.json exists on startup
  if (!fs.existsSync(TASKS_FILE_PATH)) {
    writeTasksToFile([])
      .then(() => {
        console.log("tasks.json created.");
      })
      .catch((err) => {
        console.error("Failed to create tasks.json:", err);
      });
  }
});

/*
To use this backend:
1.  Save this code as `server.js` in a new project directory.
2.  Create a `package.json` file in the same directory:
    ```json
    {
      "name": "todo-backend",
      "version": "1.0.0",
      "description": "Backend for Todo app",
      "main": "server.js",
      "scripts": {
        "start": "node server.js"
      },
      "dependencies": {
        "cors": "^2.8.5",
        "express": "^4.17.1"
      }
    }
    ```
3.  Open a terminal in that directory and run `npm install` to install dependencies.
4.  Run `npm start` or `node server.js` to start the server.
5.  A `tasks.json` file will be created (if it doesn't exist) to store your tasks.

Frontend (your existing HTML/JS) Changes:
-   Remove the `tasks` array initialization from `localStorage` or as an empty array.
-   On page load, `fetch` tasks from `GET /api/tasks`.
-   When adding a task, `fetch` with `POST /api/tasks` and the task data.
-   When dragging a task to a new column, `fetch` with `PUT /api/tasks/:id` and the new status.
-   When deleting a task, `fetch` with `DELETE /api/tasks/:id`.
-   The import/export JSON functionality would be replaced by this server interaction.
*/

