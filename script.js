"use strict";

let tasks = [];

// Elements
const taskInput = document.getElementById("taskInput");
const prioritySelect = document.getElementById("priority");
const dueDateInput = document.getElementById("dueDate");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");

const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const darkToggle = document.getElementById("darkModeToggle");

const highCount = document.getElementById("highCount");
const mediumCount = document.getElementById("mediumCount");
const lowCount = document.getElementById("lowCount");

// 🔔 Ask Notification Permission
if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
}

// 🌙 Load Dark Mode
if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark");
    darkToggle.textContent = "☀ Light Mode";
}

// 🌙 Toggle Dark Mode
darkToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const enabled = document.body.classList.contains("dark");
    localStorage.setItem("darkMode", enabled ? "enabled" : "disabled");
    darkToggle.textContent = enabled ? "☀ Light Mode" : "🌙 Dark Mode";
});

// ➕ Add Task
addBtn.addEventListener("click", addTask);
searchInput.addEventListener("input", renderTasks);
filterSelect.addEventListener("change", renderTasks);

function addTask() {
    const text = taskInput.value.trim();
    const priorityValue = prioritySelect.value;
    const dueDate = dueDateInput.value; // expected yyyy-mm-dd from <input type="date">

    if (!text || !priorityValue) {
        alert("Please fill all required fields");
        return;
    }

    const task = {
        text,
        priority: priorityValue,
        dueDate,
        completed: false
    };

    tasks.push(task);
    scheduleReminder(task);

    // ⬇⬇ NEW: download calendar event file when task has a due date
    if (dueDate) {
        downloadICS(task.text, task.dueDate);
    }

    saveAndRender();

    taskInput.value = "";
    prioritySelect.value = "";
    dueDateInput.value = "";
}

// 💾 Save & Render
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
            <strong>${task.text}</strong><br>
            Priority: ${task.priority}<br>
            ${task.dueDate ? "⏰ " + task.dueDate : ""}
        `;

        const doneBtn = document.createElement("button");
        doneBtn.textContent = "✔";
        doneBtn.onclick = () => {
            task.completed = !task.completed;
            saveAndRender();
        };

        const delBtn = document.createElement("button");
        delBtn.textContent = "❌";
        delBtn.onclick = () => {
            tasks.splice(index, 1);
            saveAndRender();
        };

        // ⬇⬇ NEW: calendar button for each task with due date
        const calBtn = document.createElement("button");
        calBtn.textContent = "📅";
        calBtn.disabled = !task.dueDate;
        calBtn.onclick = () => {
            if (task.dueDate) {
                downloadICS(task.text, task.dueDate);
            }
        };

        const actions = document.createElement("div");
        actions.className = "actions";
        actions.append(doneBtn, delBtn, calBtn);

        li.appendChild(actions);
        taskList.appendChild(li);
    });
}

// 🔔 Schedule Reminder
function scheduleReminder(task) {
    if (!task.dueDate) return;
    if (Notification.permission !== "granted") return;

    const reminderTime = new Date(task.dueDate).getTime();
    const now = Date.now();
    const delay = reminderTime - now;

    if (delay <= 0) return;

    setTimeout(() => {
        new Notification("📌 Task Reminder", {
            body: task.text
        });
    }, delay);
}

// 📊 Update Priority Counts
function updateCounts() {
    highCount.textContent = "High: " + tasks.filter(t => t.priority === "High").length;
    mediumCount.textContent = "Medium: " + tasks.filter(t => t.priority === "Medium").length;
    lowCount.textContent = "Low: " + tasks.filter(t => t.priority === "Low").length;
}

// 🔄 Load Saved Tasks
window.onload = () => {
    const saved = localStorage.getItem("tasks");
    if (saved) {
        tasks = JSON.parse(saved);
        tasks.forEach(scheduleReminder); // restore reminders
        saveAndRender();
    }
};

// =====================
// 📅 ICS DOWNLOAD PART
// =====================

// Create and download an .ics file for the given task and date
function downloadICS(taskText, taskDate) {
    // taskDate from <input type="date"> is "yyyy-mm-dd"
    const [year, month, day] = taskDate.split("-");
    const startDate = new Date(year, month - 1, day, 9, 0, 0);   // 9:00 AM
    const endDate   = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour

    function formatICSDate(d) {
        const y  = d.getFullYear();
        const m  = String(d.getMonth() + 1).padStart(2, "0");
        const da = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        const ss = String(d.getSeconds()).padStart(2, "0");
        // local time; for UTC you would add "Z" and convert.[web:21]
        return `${y}${m}${da}T${hh}${mm}${ss}`;
    }

    const dtStart = formatICSDate(startDate);
    const dtEnd   = formatICSDate(endDate);

    const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Student Task Manager//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        `UID:${Date.now()}@student-task-manager`,
        'SUMMARY:${escapeICSText(taskText)}',
        'DTSTART:${dtStart}',
        'DTEND:${dtEnd}',
        "END:VEVENT",
        "END:VCALENDAR"
    ].join(""); // important: single line

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = taskText.replace(/s+/g, "_") + ".ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}

// Escape special characters for ICS text fields.[web:25]
function escapeICSText(text) {
    return text
        .replace(/\\/g, "\\\\")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");
}