const API_BASE = "https://student-bst-management.onrender.com";

const $ = (id) => document.getElementById(id);

let students = [];

function showToast(message, error = false) {
  const toast = $("toast");

  toast.textContent = message;
  toast.className = `toast show${error ? " error" : ""}`;

  setTimeout(() => {
    toast.className = "toast";
  }, 2600);
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  let data = {};

  try {
    data = await response.json();
  } catch (_) {}

  if (!response.ok) {
    throw new Error(data.detail || "Request failed.");
  }

  return data;
}

function initials(name) {
  return name
    .split(/\s+/)
    .map(x => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

async function loadStudents() {
  try {
    const data = await api("/api/students");

    students = data.students || [];

    $("connectionText").textContent = "API connected";

    renderAll(data);

  } catch (e) {

    $("connectionText").textContent = "API offline";

    students = [];

    renderAll({
      students: [],
      count: 0,
      height: 0
    });

    showToast(
      "Could not connect to backend. Check API URL.",
      true
    );
  }
}

function renderAll(data) {

  const list = data.students || students;

  $("totalStudents").textContent =
    data.count ?? list.length;

  $("treeHeight").textContent =
    data.height ?? 0;

  const avg = list.length
    ? list.reduce(
        (sum, student) => sum + Number(student.cgpa),
        0
      ) / list.length
    : 0;

  $("avgCgpa").textContent =
    avg.toFixed(2);

  const top = list.length
    ? [...list].sort(
        (a, b) => Number(b.cgpa) - Number(a.cgpa)
      )[0]
    : null;

  $("highestCgpa").textContent =
    top ? Number(top.cgpa).toFixed(2) : "0.00";

  $("topStudent").textContent =
    top ? top.name : "No students yet";

  $("recordCount").textContent =
    `${list.length} record${list.length === 1 ? "" : "s"}`;

  $("recentStudents").innerHTML =
    list.slice(0, 5).map(student => `
      <div class="student-row">

        <div class="avatar">
          ${initials(student.name)}
        </div>

        <div class="info">
          <strong>
            ${escapeHtml(student.name)}
          </strong>

          <small>
            ID ${student.student_id} ·
            ${escapeHtml(student.course)}
          </small>
        </div>

        <div class="cgpa">
          ${Number(student.cgpa).toFixed(2)}
        </div>

      </div>
    `).join("")
    ||
    `<div class="empty">
      No student records yet.
    </div>`;

  $("studentTable").innerHTML =
    list.map(student => `
      <tr>

        <td>
          <strong>
            #${student.student_id}
          </strong>
        </td>

        <td>
          ${escapeHtml(student.name)}
        </td>

        <td>
          ${escapeHtml(student.course)}
        </td>

        <td>
          <strong>
            ${Number(student.cgpa).toFixed(2)}
          </strong>
        </td>

        <td>

          <button
            class="action-btn"
            onclick="editStudent(${student.student_id})"
          >
            Edit
          </button>

          <button
            class="action-btn delete"
            onclick="deleteStudent(${student.student_id})"
          >
            Delete
          </button>

        </td>

      </tr>
    `).join("")
    ||
    `
      <tr>
        <td colspan="5" class="empty">
          No records found.
        </td>
      </tr>
    `;
}

function escapeHtml(value) {

  return String(value).replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]
  );
}

function switchSection(section) {

  document
    .querySelectorAll(".section")
    .forEach(element => {
      element.classList.remove("active");
    });

  document
    .querySelectorAll(".nav-item")
    .forEach(element => {
      element.classList.remove("active");
    });

  $(section).classList.add("active");

  document
    .querySelector(
      `.nav-item[data-section="${section}"]`
    )
    ?.classList.add("active");

  const titles = {
    dashboard: "Student Dashboard",
    students: "Student Records",
    tree: "BST Visualizer"
  };

  $("pageTitle").textContent =
    titles[section];

  if (section === "tree") {
    loadTree();
  }
}

async function loadTree() {

  try {

    const data = await api("/api/tree");

    $("treeCanvas").innerHTML =
      data.tree
        ? buildTree(data.tree)
        : `
          <div class="empty">
            The BST is empty.
            Add students to visualize it.
          </div>
        `;

  } catch (e) {

    $("treeCanvas").innerHTML = `
      <div class="empty">
        Unable to load tree.
      </div>
    `;
  }
}

function buildTree(node) {

  if (!node) {
    return "";
  }

  const left = node.left
    ? buildTree(node.left)
    : `<div class="tree-node"></div>`;

  const right = node.right
    ? buildTree(node.right)
    : `<div class="tree-node"></div>`;

  return `
    <div class="tree-node">

      <div class="node-card">
        <strong>
          ${node.student_id}
        </strong>

        <small>
          ${escapeHtml(node.name)}
        </small>
      </div>

      ${
        node.left || node.right
          ? `<div class="children">
              ${left}
              ${right}
             </div>`
          : ""
      }

    </div>
  `;
}

function openModal(student = null) {

  $("modal").classList.add("open");

  const edit = !!student;

  $("modalEyebrow").textContent =
    edit ? "EDIT RECORD" : "NEW RECORD";

  $("modalTitle").textContent =
    edit ? "Update Student" : "Add Student";

  $("saveBtn").textContent =
    edit ? "Save Changes" : "Add Student";

  $("editOriginalId").value =
    edit ? student.student_id : "";

  $("studentId").value =
    edit ? student.student_id : "";

  $("studentName").value =
    edit ? student.name : "";

  $("studentCourse").value =
    edit ? student.course : "";

  $("studentCgpa").value =
    edit ? student.cgpa : "";

  $("studentId").disabled = edit;

  setTimeout(() => {
    $("studentName").focus();
  }, 50);
}

function closeModal() {

  $("modal").classList.remove("open");

  $("studentForm").reset();

  $("studentId").disabled = false;
}

async function saveStudent(event) {

  event.preventDefault();

  const originalId =
    $("editOriginalId").value;

  const student = {

    student_id:
      Number($("studentId").value),

    name:
      $("studentName").value.trim(),

    course:
      $("studentCourse").value.trim(),

    cgpa:
      Number($("studentCgpa").value)
  };

  try {

    if (originalId) {

      await api(
        `/api/students/${originalId}`,
        {
          method: "PUT",
          body: JSON.stringify(student)
        }
      );

      showToast(
        "Student updated successfully."
      );

    } else {

      await api(
        "/api/students",
        {
          method: "POST",
          body: JSON.stringify(student)
        }
      );

      showToast(
        "Student added successfully."
      );
    }

    closeModal();

    await loadStudents();

    if ($("tree").classList.contains("active")) {
      loadTree();
    }

  } catch (e) {

    showToast(
      e.message,
      true
    );
  }
}

window.editStudent = (id) => {

  const student =
    students.find(
      student => student.student_id === id
    );

  if (student) {
    openModal(student);
  }
};

window.deleteStudent = async (id) => {

  if (!confirm(`Delete student #${id}?`)) {
    return;
  }

  try {

    await api(
      `/api/students/${id}`,
      {
        method: "DELETE"
      }
    );

    showToast(
      "Student deleted successfully."
    );

    await loadStudents();

    if ($("tree").classList.contains("active")) {
      loadTree();
    }

  } catch (e) {

    showToast(
      e.message,
      true
    );
  }
};


/* =========================================
   SEARCH STUDENT
   ========================================= */

async function searchStudent() {

  const input =
    $("searchInput");

  const id =
    Number(input.value);

  const resultBox =
    $("searchResult");

  if (!id) {

    resultBox.innerHTML = `
      <div class="search-result error-result">
        <div class="result-icon">!</div>

        <div>
          <strong>Invalid Student ID</strong>
          <p>Please enter a valid Student ID.</p>
        </div>
      </div>
    `;

    resultBox.classList.add("visible");

    return;
  }

  resultBox.innerHTML = `
    <div class="search-result loading-result">
      <div class="result-spinner"></div>

      <div>
        <strong>Searching...</strong>
        <p>Searching the Binary Search Tree.</p>
      </div>
    </div>
  `;

  resultBox.classList.add("visible");

  try {

    const student =
      await api(`/api/students/${id}`);

    resultBox.innerHTML = `
      <div class="search-result success-result">

        <div class="result-icon success-icon">
          ✓
        </div>

        <div class="result-content">

          <div class="result-top">

            <div>
              <p class="eyebrow">
                STUDENT FOUND
              </p>

              <h3>
                ${escapeHtml(student.name)}
              </h3>
            </div>

            <span class="result-id">
              #${student.student_id}
            </span>

          </div>

          <div class="result-details">

            <div>
              <span>Course</span>
              <strong>
                ${escapeHtml(student.course)}
              </strong>
            </div>

            <div>
              <span>CGPA</span>
              <strong>
                ${Number(student.cgpa).toFixed(2)}
              </strong>
            </div>

          </div>

          <div class="result-actions">

            <button
              class="action-btn"
              onclick="editStudent(${student.student_id})"
            >
              Edit Student
            </button>

            <button
              class="action-btn delete"
              onclick="deleteStudent(${student.student_id})"
            >
              Delete Student
            </button>

          </div>

        </div>

      </div>
    `;

    showToast(
      `Student #${student.student_id} found.`
    );

  } catch (e) {

    resultBox.innerHTML = `
      <div class="search-result error-result">

        <div class="result-icon">
          ×
        </div>

        <div>
          <p class="eyebrow">
            SEARCH RESULT
          </p>

          <strong>
            Student Not Found
          </strong>

          <p>
            No student record exists with
            ID <strong>#${id}</strong>.
          </p>
        </div>

      </div>
    `;

    resultBox.classList.add("visible");

    showToast(
      "Student not found.",
      true
    );
  }
}


/* =========================================
   EVENT LISTENERS
   ========================================= */

document
  .querySelectorAll(".nav-item, .text-btn")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => switchSection(
        button.dataset.section
      )
    );

  });

$("openAddBtn")
  .addEventListener(
    "click",
    () => openModal()
  );

$("closeModal")
  .addEventListener(
    "click",
    closeModal
  );

$("modal")
  .addEventListener(
    "click",
    event => {

      if (event.target === $("modal")) {
        closeModal();
      }

    }
  );

$("studentForm")
  .addEventListener(
    "submit",
    saveStudent
  );

$("searchBtn")
  .addEventListener(
    "click",
    searchStudent
  );

$("searchInput")
  .addEventListener(
    "keydown",
    event => {

      if (event.key === "Enter") {
        searchStudent();
      }

    }
  );

$("refreshBtn")
  .addEventListener(
    "click",
    loadStudents
  );


/* =========================================
   INITIAL LOAD
   ========================================= */

loadStudents();