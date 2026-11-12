import { getData, saveData, createId } from "./storage.js";
const $ = id => document.getElementById(id);
let editingId = null;

function message(text, type = "success") {
  const region = $("toast-region");
  if (!region) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = text;
  region.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
function populateSubjects() {
  const select = $("assignment-subject");
  if (!select) return;
  const value = select.value;
  select.replaceChildren(new Option("Select subject", ""));
  getData().subjects.forEach(s => select.add(new Option(s.name, s.id)));
  select.value = value;
}
export function initAssignments() {
  const form = $("assignment-form");
  if (!form || form.dataset.initialized) return;
  form.dataset.initialized = "true";
  form.addEventListener("submit", saveAssignment);
  form.addEventListener("reset", () => setTimeout(() => { editingId = null; $("assignment-id").value = ""; $("assignment-submit-button").textContent = "＋ Add assignment"; }, 0));
  $("assignment-filter-status")?.addEventListener("change", renderAssignments);
  window.addEventListener("studentDataChanged", () => { populateSubjects(); renderAssignments(); });
  populateSubjects(); renderAssignments();
}
function saveAssignment(e) {
  e.preventDefault();
  const data = getData();
  const item = {
    id: editingId || createId(),
    title: $("assignment-title").value.trim(),
    subject: $("assignment-subject").value,
    dueDate: $("assignment-due-date").value,
    status: $("assignment-status").value,
    description: $("assignment-description").value.trim()
  };
  if (!item.title || !item.dueDate) return message("Enter assignment title and due date.", "error");
  const items = editingId ? data.assignments.map(x => x.id === editingId ? item : x) : [...data.assignments, item];
  if (!saveData({ ...data, assignments: items })) return message("Unable to save assignment.", "error");
  editingId = null; e.target.reset(); $("assignment-id").value = "";
  $("assignment-submit-button").textContent = "＋ Add assignment";
  renderAssignments(); message("Assignment saved successfully!");
}
export function renderAssignments() {
  const list = $("assignment-list");
  if (!list) return;
  const data = getData();
  const filter = $("assignment-filter-status")?.value || "all";
  const items = data.assignments.filter(x => filter === "all" || x.status === filter).sort((a,b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
  $("assignment-count").textContent = `${items.length} assignments`;
  list.replaceChildren();
  if (!items.length) { const p=document.createElement("li"); p.className="empty-state"; p.textContent="No assignments found."; list.append(p); return; }
  items.forEach(item => {
    const li=document.createElement("li"); li.className="item-card assignment-item";
    const body=document.createElement("div"); body.className="item-body";
    const title=document.createElement("h3"); title.className="item-title"; title.textContent=item.title;
    const subject=data.subjects.find(s=>s.id===item.subject)?.name || "General";
    const meta=document.createElement("p"); meta.className="item-meta"; meta.textContent=`${subject} · Due: ${item.dueDate} · ${item.status.replaceAll("-"," ")}`;
    const desc=document.createElement("p"); desc.className="item-notes"; desc.textContent=item.description || "";
    body.append(title,meta,desc);
    const actions=document.createElement("div"); actions.className="item-actions";
    const edit=document.createElement("button"); edit.type="button"; edit.className="btn btn-ghost btn-sm"; edit.textContent="Edit"; edit.addEventListener("click",()=>editAssignment(item.id));
    const del=document.createElement("button"); del.type="button"; del.className="btn btn-danger btn-sm"; del.textContent="Delete"; del.addEventListener("click",()=>deleteAssignment(item.id));
    actions.append(edit,del); li.append(body,actions); list.append(li);
  });
}
function editAssignment(id) {
  const item=getData().assignments.find(x=>x.id===id); if(!item)return;
  editingId=id; populateSubjects();
  $("assignment-id").value=item.id; $("assignment-title").value=item.title; $("assignment-subject").value=item.subject||"";
  $("assignment-due-date").value=item.dueDate; $("assignment-status").value=item.status; $("assignment-description").value=item.description||"";
  $("assignment-submit-button").textContent="Update assignment"; $("assignment-title").focus();
}
function deleteAssignment(id) {
  if(!confirm("Delete this assignment?"))return;
  const data=getData(); saveData({...data,assignments:data.assignments.filter(x=>x.id!==id)});
  renderAssignments(); message("Assignment deleted.");
}
