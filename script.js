let tasks = [];

// Elements
const addBtn = document.getElementById("addBtn");
const taskInput = document.getElementById("taskInput");
const prioritySelect = document.getElementById("priority");
const dueDateInput = document.getElementById("dueDate");
const taskList = document.getElementById("taskList");

const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const darkToggle = document.getElementById("darkModeToggle");

const highCount = document.getElementById("highCount");
const mediumCount = document.getElementById("mediumCount");
const lowCount = document.getElementById("lowCount");

// 🌙 Dark Mode Load
if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark");
    darkToggle.textContent = "☀ Light Mode";
}

// 🌙 Dark Mode Toggle
darkToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        localStorage.setItem("darkMode", "enabled");
        darkToggle.textContent = "☀ Light Mode";
    } else {
        localStorage.setItem("darkMode", "disabled");
        darkToggle.textContent = "🌙 Dark Mode";
    }
});

// Events
addBtn.addEventListener("click", addTask);
searchInput.addEventListener("input", renderTasks);
filterSelect.addEventListener("change", renderTasks);

// ➕ Add Task
function addTask() {
    const text = taskInput.value.trim();
    const priorityValue = prioritySelect.value;
    const dueDate = dueDateInput.value;

    if (!text || !priorityValue) {
        alert("Please enter task and priority");
        return;
    }

    tasks.push({
        text,
        priority: priorityValue,
        dueDate,
        completed: false
    });

    taskInput.value = "";
    prioritySelect.value = "";
    dueDateInput.value = "";

    saveAndRender();
}

// 💾 Save + Render
function saveAndRender() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    renderTasks();
    updateCounts();
}

// 🖥 Render Tasks
function renderTasks() {
    taskList.innerHTML = "";

    const search = searchInput.value.toLowerCase();
    const filter = filterSelect.value;

    tasks.forEach((task, index) => {
        if (filter !== "All" && task.priority !== filter) return;
        if (!task.text.toLowerCase().includes(search)) return;

        const li = document.createElement("li");
        li.className = task.priority.toLowerCase();
        if (task.completed) li.classList.add("completed");

        li.innerHTML = `
            ${task.text} (${task.priority})
            ${task.dueDate ? "- Due: " + task.dueDate : ""}
        `;

        const doneBtn = document.createElement("button");
        doneBtn.textContent = "✔";
        doneBtn.className = "done-btn";
        doneBtn.onclick = () => {
            task.completed = !task.completed;
            saveAndRender();
        };

        const delBtn = document.createElement("button");
        delBtn.textContent = "✖";
        delBtn.className = "delete-btn";
        delBtn.onclick = () => {
            tasks.splice(index, 1);
            saveAndRender();
        };

        const actions = document.createElement("div");
        actions.className = "actions";
        actions.append(doneBtn, delBtn);

        li.appendChild(actions);
        taskList.appendChild(li);
    });
}

// 🔢 Update Counts
function updateCounts() {
    highCount.textContent = "High: " + tasks.filter(t => t.priority === "High").length;
    mediumCount.textContent = "Medium: " + tasks.filter(t => t.priority === "Medium").length;
    lowCount.textContent = "Low: " + tasks.filter(t => t.priority === "Low").length;
}

// 🔁 Load Tasks
window.onload = () => {
    const saved = localStorage.getItem("tasks");
    if (saved) {
        tasks = JSON.parse(saved);
        saveAndRender();
    }
};