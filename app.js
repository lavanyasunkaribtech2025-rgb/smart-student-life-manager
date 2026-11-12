
import { initExams } from "./exams.js";
import { initSubjects } from "./subjects.js";
import { initTasks } from "./tasks.js";
import { initNotes } from "./notes.js";
import { initProgress } from "./progress.js";
import { initDashboard } from "./dashboard.js";
import { initAssignments } from "./assignments.js";
import { initTimetable } from "./timetable.js";

import {
  getData,
  saveData,
  resetData,
  exportData,
  importData,
  createId
} from "./storage.js";

// Main application state
let appData = getData();

// Short helper to select HTML elements
const $ = (selector) => document.querySelector(selector);

// Select elements by ID
const byId = (id) => document.getElementById(id);

// Save current application data
function saveAppData() {
  const currentData = getData();
  currentData.settings = { ...currentData.settings, ...appData.settings };
  appData = currentData;
  const saved = saveData(currentData);

  if (!saved) {
    showToast("Unable to save data. Check browser storage.", "error");
  }

  return saved;
}

// Display a notification message
function showToast(message, type = "success") {
  const region = byId("toast-region");

  if (!region) {
    console.log(message);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  region.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Update page title and show selected page
function navigateToPage(pageName) {
  const sections = document.querySelectorAll("[data-page-section]");
  const navigationLinks = document.querySelectorAll("[data-page]");

  let pageFound = false;

  sections.forEach((section) => {
    const active = section.dataset.pageSection === pageName;
    section.hidden = !active;

    if (active) pageFound = true;
  });

  navigationLinks.forEach((link) => {
    const active = link.dataset.page === pageName;
    link.classList.toggle("active", active);
    link.setAttribute("aria-current", active ? "page" : "false");
  });

  if (!pageFound) return;

  const activeLink = $(`[data-page="${pageName}"]`);
  const title = byId("page-title");

  if (title && activeLink) {
    title.textContent = activeLink.textContent.trim();
  }

  closeSidebar();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Sidebar controls
function openSidebar() {
  byId("sidebar")?.classList.add("open");
  byId("sidebar-backdrop")?.classList.add("visible");
}

function closeSidebar() {
  byId("sidebar")?.classList.remove("open");
  byId("sidebar-backdrop")?.classList.remove("visible");
}

// Connect navigation buttons
function initializeNavigation() {
  document.querySelectorAll("[data-page]").forEach((link) => {
    link.addEventListener("click", () => {
      navigateToPage(link.dataset.page);
    });
  });

  document.querySelectorAll("[data-go-page]").forEach((button) => {
    button.addEventListener("click", () => {
      navigateToPage(button.dataset.goPage);
    });
  });

  byId("sidebar-toggle")?.addEventListener("click", openSidebar);
  byId("sidebar-close")?.addEventListener("click", closeSidebar);
  byId("sidebar-backdrop")?.addEventListener("click", closeSidebar);
}

// Display today's date
function initializeDate() {
  const dateElement = byId("today-date");

  if (dateElement) {
    dateElement.textContent = new Date().toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );
  }
}

// Update profile name
function initializeProfile() {
  const nameInput = byId("settings-display-name");
  const profileName = byId("profile-name");
  const avatar = byId("profile-avatar");

  function updateProfile() {
    const name = appData.settings.displayName || "Student";

    if (nameInput) nameInput.value = name;
    if (profileName) profileName.textContent = name;
    if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
  }

  updateProfile();

  byId("profile-form")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = nameInput?.value.trim();

    if (!name) {
      showToast("Please enter your name.", "error");
      return;
    }

    appData.settings.displayName = name;

    if (saveAppData()) {
      updateProfile();
      showToast("Profile updated successfully!");
    }
  });
}

// Import and export data
function initializeDataBackup() {
  byId("export-data-button")?.addEventListener("click", () => {
    exportData();
    showToast("Your backup is ready to download.");
  });

  byId("import-data-button")?.addEventListener("click", () => {
    byId("import-data-input")?.click();
  });

  byId("import-data-input")?.addEventListener("change", async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    try {
      await importData(file);
      appData = getData();

      showToast("Data imported successfully!");
      window.location.reload();
    } catch (error) {
      showToast(error.message || "Import failed.", "error");
    }

    event.target.value = "";
  });
}

// Confirmation dialog
function confirmAction(title, message, onConfirm) {
  const dialog = byId("confirm-dialog");

  if (!dialog) {
    if (window.confirm(message)) onConfirm();
    return;
  }

  const titleElement = byId("confirm-dialog-title");
  const messageElement = byId("confirm-dialog-message");
  const form = byId("confirm-dialog-form");

  if (!form || typeof dialog.showModal !== "function") {
    if (window.confirm(message)) onConfirm();
    return;
  }

  titleElement.textContent = title;
  messageElement.textContent = message;

  form.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      dialog.close();
      onConfirm();
    },
    { once: true }
  );

  dialog.showModal();
}

// Delete all saved data
function initializeDeleteData() {
  byId("delete-all-data-button")?.addEventListener("click", () => {
    confirmAction(
      "Delete all data?",
      "This will permanently delete your tasks, exams, assignments, notes and other saved information.",
      () => {
        resetData();
        appData = getData();

        showToast("All application data has been deleted.");
        window.location.reload();
      }
    );
  });
}

// Dismiss storage warning
function initializeStorageWarning() {
  byId("dismiss-storage-warning")?.addEventListener("click", () => {
    byId("storage-warning")?.setAttribute("hidden", "");
  });
}

// Add sample information for testing
function initializeDemoData() {
  byId("load-demo-data-button")?.addEventListener("click", () => {
    confirmAction(
      "Load demo data?",
      "Demo information will be added to your current data.",
      () => {
        appData = getData();
        const subjectId = createId();

        appData.subjects.push({
          id: subjectId,
          name: "Business Analytics",
          code: "BA101",
          description: "Introduction to Business Analytics"
        });

        appData.tasks.push({
          id: createId(),
          title: "Complete Python assignment",
          description: "Practice Python and Pandas",
          subject: subjectId,
          priority: "high",
          dueDate: new Date().toISOString().slice(0, 10),
          status: "pending"
        });

        appData.exams.push({
          id: createId(),
          title: "Business Analytics Test",
          subject: subjectId,
          date: new Date(Date.now() + 7 * 86400000)
            .toISOString().slice(0, 10),
          time: "10:00",
          location: "Classroom",
          notes: "Revise important topics"
        });

        saveAppData();
        showToast("Demo data added successfully!");
        window.location.reload();
      }
    );
  });
}

// Search tasks, exams, assignments and notes
function initializeSearch() {
  const searchInput = byId("global-search-input");
  const results = byId("search-results");

  if (!searchInput || !results) return;

  searchInput.addEventListener("input", () => {
    appData = getData();
    const query = searchInput.value.trim().toLowerCase();

    results.replaceChildren();

    if (!query) {
      results.hidden = true;
      return;
    }

    const collections = [
      { key: "tasks", page: "tasks" },
      { key: "exams", page: "exams" },
      { key: "assignments", page: "assignments" },
      { key: "notes", page: "notes" },
      { key: "subjects", page: "subjects" }
    ];

    let matchCount = 0;

    collections.forEach(({ key, page }) => {
      appData[key].forEach((item) => {
        const searchableText = [
          item.title,
          item.name,
          item.description,
          item.content,
          item.code
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(query)) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "search-result-item";
        button.textContent = item.title || item.name;

        button.addEventListener("click", () => {
          navigateToPage(page);
          results.hidden = true;
          searchInput.value = "";
        });

        results.appendChild(button);
        matchCount++;
      });
    });

    if (matchCount === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No results found.";
      results.appendChild(empty);
    }

    results.hidden = false;
  });
}

// Application startup
function initializeApp() {
  initializeNavigation();

  initSubjects();
  initTasks();
  initAssignments();
  initExams();
  initNotes();
  initTimetable();
  initDashboard();
  initProgress();

  initializeDate();
  initializeProfile();
  initializeDataBackup();
  initializeDeleteData();
  initializeStorageWarning();
  initializeDemoData();
  initializeSearch();

  navigateToPage("dashboard");

  console.log("Smart Student Life Manager initialized!");
}

// Start application after HTML loads
document.addEventListener("DOMContentLoaded", initializeApp);