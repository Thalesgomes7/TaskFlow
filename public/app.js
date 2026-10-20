const API_URL = "/api/tasks";
const taskList = document.querySelector("#task-list");
const taskTemplate = document.querySelector("#task-template");
const taskDialog = document.querySelector("#task-dialog");
const taskForm = document.querySelector("#task-form");
const statusMessage = document.querySelector("#status-message");
const searchInput = document.querySelector("#search-input");
const priorityFilter = document.querySelector("#priority-filter");
const formError = document.querySelector("#form-error");

const state = {
  tasks: [],
  status: "all",
  query: "",
  priority: "all",
  editingId: null
};

const labels = {
  status: { pending: "A fazer", in_progress: "Em andamento", completed: "Concluída" },
  priority: { low: "Baixa prioridade", medium: "Média prioridade", high: "Alta prioridade" }
};

function setMessage(message = "", isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle("is-error", isError);
}

function formatDate(dateString) {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(year, month - 1, day));
}

function isOverdue(task) {
  if (!task.dueDate || task.status === "completed") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = task.dueDate.split("-").map(Number);
  return new Date(year, month - 1, day) < today;
}

function filteredTasks() {
  return state.tasks.filter((task) => {
    const matchesStatus = state.status === "all" || task.status === state.status;
    const matchesPriority = state.priority === "all" || task.priority === state.priority;
    const query = state.query.trim().toLocaleLowerCase("pt-BR");
    const matchesQuery = !query || `${task.title} ${task.description}`.toLocaleLowerCase("pt-BR").includes(query);
    return matchesStatus && matchesPriority && matchesQuery;
  });
}

function updateStats() {
  const total = state.tasks.length;
  const pending = state.tasks.filter((task) => task.status === "pending").length;
  const progress = state.tasks.filter((task) => task.status === "in_progress").length;
  const completed = state.tasks.filter((task) => task.status === "completed").length;

  document.querySelector("#stat-total").textContent = total;
  document.querySelector("#stat-pending").textContent = pending;
  document.querySelector("#stat-progress").textContent = progress;
  document.querySelector("#stat-completed").textContent = completed;
  document.querySelector("#all-count").textContent = total;
}

function createEmptyState() {
  const wrapper = document.createElement("div");
  wrapper.className = "empty-state";
  const icon = document.createElement("div");
  icon.className = "empty-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = "✦";
  const title = document.createElement("h3");
  const description = document.createElement("p");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button button-primary";
  button.textContent = state.query || state.priority !== "all" || state.status !== "all"
    ? "Limpar filtros"
    : "Criar primeira tarefa";

  if (state.query || state.priority !== "all" || state.status !== "all") {
    title.textContent = "Nenhuma tarefa encontrada";
    description.textContent = "Tente mudar os filtros ou usar outro termo de busca.";
    button.addEventListener("click", clearFilters);
  } else {
    title.textContent = "Tudo começa com uma ideia";
    description.textContent = "Adicione sua primeira tarefa e dê o próximo passo em direção aos seus objetivos.";
    button.addEventListener("click", () => openDialog());
  }

  wrapper.append(icon, title, description, button);
  return wrapper;
}

function renderTasks() {
  taskList.replaceChildren();
  const tasks = filteredTasks();
  document.querySelector("#result-count").textContent = `${tasks.length} ${tasks.length === 1 ? "tarefa" : "tarefas"}`;

  if (!tasks.length) {
    taskList.append(createEmptyState());
    return;
  }

  for (const task of tasks) {
    const fragment = taskTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".task-card");
    const checkButton = fragment.querySelector(".task-check");
    const title = fragment.querySelector(".task-title");
    const description = fragment.querySelector(".task-description");
    const priority = fragment.querySelector(".priority-badge");
    const status = fragment.querySelector(".task-status");
    const due = fragment.querySelector(".task-due");
    const editButton = fragment.querySelector(".edit-task");
    const deleteButton = fragment.querySelector(".delete-task");

    if (task.status === "completed") card.classList.add("is-completed");
    title.textContent = task.title;
    description.textContent = task.description;
    priority.textContent = labels.priority[task.priority];
    priority.classList.add(`priority-${task.priority}`);
    status.textContent = labels.status[task.status];
    status.classList.add(`status-${task.status}`);

    checkButton.setAttribute("aria-label", task.status === "completed"
      ? `Reabrir tarefa: ${task.title}`
      : `Marcar como concluída: ${task.title}`);
    checkButton.addEventListener("click", () => toggleTask(task));

    if (task.dueDate) {
      due.textContent = `${isOverdue(task) ? "Atrasada · " : "Prazo · "}${formatDate(task.dueDate)}`;
      if (isOverdue(task)) due.classList.add("is-overdue");
    }

    editButton.addEventListener("click", () => openDialog(task));
    deleteButton.setAttribute("aria-label", `Excluir tarefa: ${task.title}`);
    deleteButton.addEventListener("click", () => removeTask(task));

    taskList.append(fragment);
  }
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers }
  });
  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Não foi possível concluir a operação.");
  return data;
}

async function loadTasks() {
  taskList.setAttribute("aria-busy", "true");
  setMessage("");
  try {
    state.tasks = await request(API_URL);
    updateStats();
    renderTasks();
  } catch (error) {
    setMessage(`${error.message} Verifique se o servidor está em execução.`, true);
    taskList.replaceChildren();
  } finally {
    taskList.setAttribute("aria-busy", "false");
  }
}

function openDialog(task = null) {
  state.editingId = task?.id || null;
  taskForm.reset();
  formError.textContent = "";
  document.querySelector("#task-id").value = task?.id || "";
  document.querySelector("#dialog-title").textContent = task ? "Editar tarefa" : "Criar nova tarefa";
  document.querySelector("#save-task").textContent = task ? "Salvar alterações" : "Salvar tarefa";
  document.querySelector("#task-title").value = task?.title || "";
  document.querySelector("#task-description").value = task?.description || "";
  document.querySelector("#task-priority").value = task?.priority || "medium";
  document.querySelector("#task-status").value = task?.status || "pending";
  document.querySelector("#task-due-date").value = task?.dueDate || "";
  taskDialog.showModal();
  document.querySelector("#task-title").focus();
}

function closeDialog() {
  taskDialog.close();
  state.editingId = null;
  formError.textContent = "";
}

async function saveTask(event) {
  event.preventDefault();
  formError.textContent = "";
  const payload = {
    title: document.querySelector("#task-title").value.trim(),
    description: document.querySelector("#task-description").value.trim(),
    priority: document.querySelector("#task-priority").value,
    status: document.querySelector("#task-status").value,
    dueDate: document.querySelector("#task-due-date").value
  };

  if (!payload.title) {
    formError.textContent = "Informe um título para a tarefa.";
    return;
  }

  const editing = Boolean(state.editingId);
  const url = editing ? `${API_URL}/${encodeURIComponent(state.editingId)}` : API_URL;
  try {
    await request(url, {
      method: editing ? "PATCH" : "POST",
      body: JSON.stringify(payload)
    });
    closeDialog();
    setMessage(editing ? "Tarefa atualizada com sucesso." : "Tarefa criada com sucesso.");
    await loadTasks();
    setMessage(editing ? "Tarefa atualizada com sucesso." : "Tarefa criada com sucesso.");
  } catch (error) {
    formError.textContent = error.message;
  }
}

async function toggleTask(task) {
  const nextStatus = task.status === "completed" ? "pending" : "completed";
  try {
    await request(`${API_URL}/${encodeURIComponent(task.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus })
    });
    await loadTasks();
    setMessage(nextStatus === "completed" ? "Tarefa concluída. Muito bem!" : "Tarefa reaberta.");
  } catch (error) {
    setMessage(error.message, true);
  }
}

async function removeTask(task) {
  const confirmed = window.confirm(`Deseja realmente excluir a tarefa "${task.title}"?`);
  if (!confirmed) return;
  try {
    await request(`${API_URL}/${encodeURIComponent(task.id)}`, { method: "DELETE" });
    await loadTasks();
    setMessage("Tarefa excluída.");
  } catch (error) {
    setMessage(error.message, true);
  }
}

function clearFilters() {
  state.status = "all";
  state.query = "";
  state.priority = "all";
  searchInput.value = "";
  priorityFilter.value = "all";
  document.querySelectorAll("[data-status]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.status === "all");
  });
  renderTasks();
}

function applyFilters() {
  state.query = searchInput.value;
  state.priority = priorityFilter.value;
  renderTasks();
}

document.querySelector("#open-create").addEventListener("click", () => openDialog());
document.querySelector("#close-dialog").addEventListener("click", closeDialog);
document.querySelector("#cancel-dialog").addEventListener("click", closeDialog);
taskForm.addEventListener("submit", saveTask);
taskDialog.addEventListener("click", (event) => {
  if (event.target === taskDialog) closeDialog();
});
searchInput.addEventListener("input", applyFilters);
priorityFilter.addEventListener("change", applyFilters);
document.querySelector("#clear-filters").addEventListener("click", clearFilters);

document.querySelectorAll("[data-status]").forEach((button) => {
  button.addEventListener("click", () => {
    state.status = button.dataset.status;
    document.querySelectorAll("[data-status]").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });
    renderTasks();
  });
});

const now = new Date();
document.querySelector("#current-date").textContent = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long", day: "numeric", month: "long"
}).format(now).toLocaleUpperCase("pt-BR");

loadTasks();
