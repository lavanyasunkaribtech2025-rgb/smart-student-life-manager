const STORAGE_KEY = "smartStudentLifeManager";

const defaultData = {
  tasks: [],
  sessions: [],
  exams: [],
  assignments: [],
  notes: [],
  subjects: [],
  settings: { displayName: "Student", remindersEnabled: false, reminderDays: 1 }
};

const legacyKeys = {
  tasks: "student_tasks",
  sessions: "student_timetable",
  exams: "student_exams",
  assignments: "student_assignments",
  notes: "student_notes"
};

export function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getDefaultData() {
  return JSON.parse(JSON.stringify(defaultData));
}

function normalizeData(input = {}) {
  const result = { ...getDefaultData(), ...input };
  for (const key of ["tasks", "sessions", "exams", "assignments", "notes", "subjects"]) {
    if (!Array.isArray(result[key])) result[key] = [];
  }
  result.settings = { ...defaultData.settings, ...(input.settings || {}) };
  return result;
}

export function getData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let data = raw ? normalizeData(JSON.parse(raw)) : getDefaultData();

    // One-time migration: bring older module-specific data into the main store.
    let migrated = false;
    for (const [section, key] of Object.entries(legacyKeys)) {
      const oldRaw = localStorage.getItem(key);
      if (oldRaw) {
        const oldItems = JSON.parse(oldRaw);
        if (Array.isArray(oldItems) && data[section].length === 0 && oldItems.length) {
          data[section] = oldItems;
          migrated = true;
        }
      }
    }
    if (migrated || !raw) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error("Error loading application data:", error);
    return getDefaultData();
  }
}

export function saveData(data) {
  try {
    const normalized = normalizeData(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent("studentDataChanged"));
    return true;
  } catch (error) {
    console.error("Error saving application data:", error);
    return false;
  }
}

export function updateData(section, value) {
  const data = getData();
  if (!Object.prototype.hasOwnProperty.call(data, section)) return false;
  data[section] = value;
  return saveData(data);
}

export function resetData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    Object.values(legacyKeys).forEach(key => localStorage.removeItem(key));
    window.dispatchEvent(new CustomEvent("studentDataChanged"));
    return true;
  } catch (error) {
    console.error("Error resetting application data:", error);
    return false;
  }
}

export function exportData() {
  const blob = new Blob([JSON.stringify(getData(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "student-life-manager-backup.json";
  link.click();
  URL.revokeObjectURL(url);
}

export async function importData(file) {
  if (!file) throw new Error("No file selected.");
  try {
    const imported = JSON.parse(await file.text());
    const required = ["tasks", "sessions", "exams", "assignments", "notes", "subjects"];
    for (const section of required) {
      if (!Array.isArray(imported[section])) throw new Error(`Invalid or missing "${section}" data.`);
    }
    if (!saveData(imported)) throw new Error("Unable to save imported data.");
    return true;
  } catch (error) {
    console.error("Import failed:", error);
    throw error;
  }
}
