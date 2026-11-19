// Set this to your deployed FastAPI URL before deploying the frontend.
// Example: "https://your-student-bst-api.onrender.com"
const API_BASE = localStorage.getItem("bst_api_url") || "http://127.0.0.1:8000";

const $ = (id) => document.getElementById(id);
let students = [];

function showToast(message, error = false) {
  const toast = $("toast");
  toast.textContent = message;
  toast.className = `toast show${error ? " error" : ""}`;
  setTimeout(() => toast.className = "toast", 2600);
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {"Content-Type": "application/json", ...(options.headers || {})},
    ...options
  });
  let data = {};
  try { data = await response.json(); } catch (_) {}
  if (!response.ok) throw new Error(data.detail || "Request failed.");
  return data;
}

function initials(name) {
  return name.split(/\s+/).map(x => x[0]).slice(0,2).join("").toUpperCase();
}

async function loadStudents() {
  try {
    const data = await api("/api/students");
    students = data.students;
    $("connectionText").textContent = "API connected";
    renderAll(data);
  } catch (e) {
    $("connectionText").textContent = "API offline";
    renderAll({students: [], count: 0, height: 0});
    showToast("Could not connect to backend. Check API URL.", true);
  }
}

function renderAll(data) {
  const list = data.students || students;
  $("totalStudents").textContent = data.count ?? list.length;
  $("treeHeight").textContent = data.height ?? 0;
  const avg = list.length ? list.reduce((s,x) => s + Number(x.cgpa),0) / list.length : 0;
  $("avgCgpa").textContent = avg.toFixed(2);
  const top = list.length ? [...list].sort((a,b)=>b.cgpa-a.cgpa)[0] : null;
  $("highestCgpa").textContent = top ? Number(top.cgpa).toFixed(2) : "0.00";
  $("topStudent").textContent = top ? top.name : "No students yet";
  $("recordCount").textContent = `${list.length} record${list.length === 1 ? "" : "s"}`;

  $("recentStudents").innerHTML = list.slice(0,5).map(s => `
    <div class="student-row">
      <div class="avatar">${initials(s.name)}</div>
      <div class="info"><strong>${escapeHtml(s.name)}</strong><small>ID ${s.student_id} · ${escapeHtml(s.course)}</small></div>
      <div class="cgpa">${Number(s.cgpa).toFixed(2)}</div>
    </div>
  `).join("") || `<div class="empty">No student records yet.</div>`;

  $("studentTable").innerHTML = list.map(s => `
    <tr>
      <td><strong>#${s.student_id}</strong></td>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.course)}</td>
      <td><strong>${Number(s.cgpa).toFixed(2)}</strong></td>
      <td>
        <button class="action-btn" onclick="editStudent(${s.student_id})">Edit</button>
        <button class="action-btn delete" onclick="deleteStudent(${s.student_id})">Delete</button>
      </td>
    </tr>
  `).join("") || `<tr><td colspan="5" class="empty">No records found.</td></tr>`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function switchSection(section) {
  document.querySelectorAll(".section").forEach(x => x.classList.remove("active"));
  document.querySelectorAll(".nav-item").forEach(x => x.classList.remove("active"));
  $(section).classList.add("active");
  document.querySelector(`.nav-item[data-section="${section}"]`)?.classList.add("active");
  const titles = {dashboard:"Student Dashboard",students:"Student Records",tree:"BST Visualizer"};
  $("pageTitle").textContent = titles[section];
  if(section === "tree") loadTree();
}

async function loadTree() {
  try {
    const data = await api("/api/tree");
    $("treeCanvas").innerHTML = data.tree ? buildTree(data.tree) : `<div class="empty">The BST is empty. Add students to visualize it.</div>`;
  } catch (e) {
    $("treeCanvas").innerHTML = `<div class="empty">Unable to load tree.</div>`;
  }
}

function buildTree(node) {
  if (!node) return "";
  const left = node.left ? buildTree(node.left) : `<div class="tree-node"></div>`;
  const right = node.right ? buildTree(node.right) : `<div class="tree-node"></div>`;
  return `
    <div class="tree-node">
      <div class="node-card"><strong>${node.student_id}</strong><small>${escapeHtml(node.name)}</small></div>
      ${(node.left || node.right) ? `<div class="children">${left}${right}</div>` : ""}
    </div>`;
}

function openModal(student = null) {
  $("modal").classList.add("open");
  const edit = !!student;
  $("modalEyebrow").textContent = edit ? "EDIT RECORD" : "NEW RECORD";
  $("modalTitle").textContent = edit ? "Update Student" : "Add Student";
  $("saveBtn").textContent = edit ? "Save Changes" : "Add Student";
  $("editOriginalId").value = edit ? student.student_id : "";
  $("studentId").value = edit ? student.student_id : "";
  $("studentName").value = edit ? student.name : "";
  $("studentCourse").value = edit ? student.course : "";
  $("studentCgpa").value = edit ? student.cgpa : "";
  $("studentId").disabled = edit;
  setTimeout(() => $("studentName").focus(), 50);
}

function closeModal() {
  $("modal").classList.remove("open");
  $("studentForm").reset();
  $("studentId").disabled = false;
}

async function saveStudent(event) {
  event.preventDefault();
  const originalId = $("editOriginalId").value;
  const student = {
    student_id: Number($("studentId").value),
    name: $("studentName").value.trim(),
    course: $("studentCourse").value.trim(),
    cgpa: Number($("studentCgpa").value)
  };
  try {
    if (originalId) {
      await api(`/api/students/${originalId}`, {method:"PUT", body:JSON.stringify(student)});
      showToast("Student updated successfully.");
    } else {
      await api("/api/students", {method:"POST", body:JSON.stringify(student)});
      showToast("Student added successfully.");
    }
    closeModal();
    await loadStudents();
    if ($("tree").classList.contains("active")) loadTree();
  } catch(e) { showToast(e.message, true); }
}

window.editStudent = (id) => {
  const student = students.find(s => s.student_id === id);
  if (student) openModal(student);
};

window.deleteStudent = async (id) => {
  if (!confirm(`Delete student #${id}?`)) return;
  try {
    await api(`/api/students/${id}`, {method:"DELETE"});
    showToast("Student deleted successfully.");
    await loadStudents();
    if ($("tree").classList.contains("active")) loadTree();
  } catch(e) { showToast(e.message, true); }
};

async function searchStudent() {
  const id = Number($("searchInput").value);
  if (!id) { showToast("Enter a Student ID.", true); return; }
  try {
    const s = await api(`/api/students/${id}`);
    showToast(`Found: ${s.name} · CGPA ${Number(s.cgpa).toFixed(2)}`);
  } catch(e) { showToast(e.message, true); }
}

document.querySelectorAll(".nav-item, .text-btn").forEach(btn => {
  btn.addEventListener("click", () => switchSection(btn.dataset.section));
});
$("openAddBtn").addEventListener("click", () => openModal());
$("closeModal").addEventListener("click", closeModal);
$("modal").addEventListener("click", e => { if(e.target === $("modal")) closeModal(); });
$("studentForm").addEventListener("submit", saveStudent);
$("searchBtn").addEventListener("click", searchStudent);
$("searchInput").addEventListener("keydown", e => { if(e.key === "Enter") searchStudent(); });
$("refreshBtn").addEventListener("click", loadStudents);

loadStudents();
