
import { getData, saveData, createId } from "./storage.js";

const getElement = (id) => document.getElementById(id);

let editingTaskId = null;

// Display notification
function showMessage(message) {
  const region = getElement("toast-region");

  if (!region) return;

  const toast = document.createElement("div");
  toast.className = "toast toast-success";
  toast.textContent = message;

  region.appendChild(toast);

  setTimeout(() => toast.remove(), 3000);
}

// Save updated tasks
function saveTasks(tasks) {
  const success = saveData({
    ...getData(),
    tasks
  });

  if (!success) {
    showMessage("Unable to save task.");
  }

  return success;
}

// Load subjects into task subject dropdown
function loadSubjects() {
  const select = getElement("task-subject");
  if (!select) return;

  const selectedValue = select.value;
  const data = getData();

  select.replaceChildren();

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select subject";
  select.appendChild(defaultOption);

  data.subjects.forEach((subject) => {
    const option = document.createElement("option");
    option.value = subject.id;
    option.textContent = subject.name;
    select.appendChild(option);
  });

  if (data.subjects.some((subject) => subject.id === selectedValue)) {
    select.value = selectedValue;
  }
}

// Create one task card
function createTaskCard(task, subjects) {
  const card = document.createElement("li");
card.className = "item-card task-item";

  const subject = subjects.find((item) => item.id === task.subject);

  const title = document.createElement("h3");
  title.textContent = task.title;

  const description = document.createElement("p");
  description.textContent = task.description || "No description";

  const subjectText = document.createElement("p");
  subjectText.textContent = `Subject: ${subject?.name || "General"}`;

  const dueDate = document.createElement("p");
  dueDate.textContent = task.dueDate
    ? `Due: ${task.dueDate}`
    : "No due date";

  const details = document.createElement("p");
  details.textContent =
    `Priority: ${task.priority} | Status: ${task.status}`;

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.textContent = "Edit";

  editButton.addEventListener("click", () => {
    editTask(task.id);
  });

  const completeButton = document.createElement("button");
  completeButton.type = "button";

  completeButton.textContent =
    task.status === "completed" ? "Mark Pending" : "Complete";

  completeButton.addEventListener("click", () => {
    toggleTaskStatus(task.id);
  });

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "Delete";

  deleteButton.addEventListener("click", () => {
    deleteTask(task.id);
  });

  actions.append(editButton, completeButton, deleteButton);

  card.append(title, description, subjectText, dueDate, details, actions);

  return card;
}

// Display all tasks
export function renderTasks() {
  const list = getElement("task-list");
  if (!list) return;

  const data = getData();

  const statusFilter = getElement("task-filter-status")?.value || "all";
  const priorityFilter = getElement("task-filter-priority")?.value || "all";

  let tasks = [...data.tasks];

  if (statusFilter !== "all") {
    tasks = tasks.filter((task) => task.status === statusFilter);
  }

  if (priorityFilter !== "all") {
    tasks = tasks.filter((task) => task.priority === priorityFilter);
  }

  list.replaceChildren();

  const count = getElement("task-count");
  if (count) {
    count.textContent = `${tasks.length} task(s)`;
  }

  if (tasks.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent = "No tasks found. Add your first task!";
    list.appendChild(emptyMessage);
    return;
  }

  tasks.sort((a, b) => {
    return (a.dueDate || "9999-12-31")
      .localeCompare(b.dueDate || "9999-12-31");
  });

  tasks.forEach((task) => {
    list.appendChild(createTaskCard(task, data.subjects));
  });
}

// Add or update a task
function handleTaskSubmit(event) {
  event.preventDefault();

  const title = getElement("task-title").value.trim();

  if (!title) {
    showMessage("Please enter a task title.");
    return;
  }

  const data = getData();

  const task = {
    id: editingTaskId || createId(),
    title,
    description: getElement("task-description").value.trim(),
    subject: getElement("task-subject").value,
    priority: getElement("task-priority").value,
    dueDate: getElement("task-due-date").value,
    status: getElement("task-status").value
  };

  let updatedTasks;

  if (editingTaskId) {
    updatedTasks = data.tasks.map((item) =>
      item.id === editingTaskId ? task : item
    );
  } else {
    updatedTasks = [...data.tasks, task];
  }

  if (saveTasks(updatedTasks)) {
    showMessage(editingTaskId ? "Task updated!" : "Task added!");

    resetTaskForm();
    renderTasks();
  }
}

// Edit a task
function editTask(id) {
  const task = getData().tasks.find((item) => item.id === id);

  if (!task) return;

  editingTaskId = id;

  loadSubjects();

  getElement("task-id").value = task.id;
  getElement("task-title").value = task.title;
  getElement("task-description").value = task.description || "";
  getElement("task-subject").value = task.subject || "";
  getElement("task-priority").value = task.priority;
  getElement("task-due-date").value = task.dueDate || "";
  getElement("task-status").value = task.status;

  const heading = getElement("task-form-title");
  const submitButton = getElement("task-submit-button");

  if (heading) heading.textContent = "Edit Task";
  if (submitButton) submitButton.textContent = "Update Task";

  getElement("task-form")?.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

// Delete a task
function deleteTask(id) {
  const confirmed = window.confirm("Are you sure you want to delete this task?");

  if (!confirmed) return;

  const updatedTasks = getData().tasks.filter(
    (task) => task.id !== id
  );

  if (saveTasks(updatedTasks)) {
    showMessage("Task deleted.");
    renderTasks();
  }
}

// Mark task as completed or pending
function toggleTaskStatus(id) {
  const updatedTasks = getData().tasks.map((task) => {
    if (task.id !== id) return task;

    return {
      ...task,
      status: task.status === "completed" ? "pending" : "completed"
    };
  });

  if (saveTasks(updatedTasks)) {
    showMessage("Task status updated.");
    renderTasks();
  }
}

// Reset task form
function resetTaskForm() {
  const form = getElement("task-form");

  form?.reset();

  editingTaskId = null;

  if (getElement("task-id")) {
    getElement("task-id").value = "";
  }

  if (getElement("task-form-title")) {
    getElement("task-form-title").textContent = "Add New Task";
  }

  if (getElement("task-submit-button")) {
    getElement("task-submit-button").textContent = "Add Task";
  }
}

// Initialize task manager
export function initTasks() {
  const form = getElement("task-form");

  if (!form || form.dataset.initialized === "true") return;

  form.dataset.initialized = "true";

  form.addEventListener("submit", handleTaskSubmit);

  getElement("task-reset-button")?.addEventListener("click", resetTaskForm);

  getElement("task-filter-status")?.addEventListener("change", renderTasks);

  getElement("task-filter-priority")?.addEventListener("change", renderTasks);

  loadSubjects();
  renderTasks();
  window.addEventListener("studentDataChanged", () => { loadSubjects(); renderTasks(); });
}
