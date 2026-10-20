const { readTasks, writeTasks } = require("./data-store");

const STATUSES = ["pending", "in_progress", "completed"];
const PRIORITIES = ["low", "medium", "high"];
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function validateTaskInput(input, partial = false) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw validationError("Envie um objeto JSON válido.");
  }

  const allowed = ["title", "description", "priority", "status", "dueDate"];
  for (const key of Object.keys(input)) {
    if (!allowed.includes(key)) throw validationError(`Campo não permitido: ${key}.`);
  }

  if (!partial || own(input, "title")) {
    if (typeof input.title !== "string" || !input.title.trim()) {
      throw validationError("O título é obrigatório.");
    }
    if (input.title.trim().length > 100) {
      throw validationError("O título deve ter no máximo 100 caracteres.");
    }
  }

  if (own(input, "description")) {
    if (typeof input.description !== "string" || input.description.length > 1000) {
      throw validationError("A descrição deve ser um texto de até 1000 caracteres.");
    }
  }

  if (own(input, "priority") && !PRIORITIES.includes(input.priority)) {
    throw validationError("Prioridade inválida.");
  }

  if (own(input, "status") && !STATUSES.includes(input.status)) {
    throw validationError("Status inválido.");
  }

  if (own(input, "dueDate") && input.dueDate !== "") {
    if (typeof input.dueDate !== "string" || !/^\\d{4}-\\d{2}-\\d{2}$/.test(input.dueDate)) {
      throw validationError("A data deve estar no formato AAAA-MM-DD.");
    }
    const date = new Date(`${input.dueDate}T00:00:00Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== input.dueDate) {
      throw validationError("Informe uma data válida.");
    }
  }
}

async function listTasks(filters = {}) {
  let tasks = await readTasks();

  if (filters.status && STATUSES.includes(filters.status)) {
    tasks = tasks.filter((task) => task.status === filters.status);
  }
  if (filters.priority && PRIORITIES.includes(filters.priority)) {
    tasks = tasks.filter((task) => task.priority === filters.priority);
  }
  if (typeof filters.q === "string" && filters.q.trim()) {
    const query = filters.q.trim().toLocaleLowerCase("pt-BR");
    tasks = tasks.filter((task) =>
      `${task.title} ${task.description}`.toLocaleLowerCase("pt-BR").includes(query)
    );
  }

  return tasks.sort((a, b) => {
    if (a.status === "completed" && b.status !== "completed") return 1;
    if (a.status !== "completed" && b.status === "completed") return -1;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

async function getTask(id) {
  const tasks = await readTasks();
  return tasks.find((task) => task.id === id) || null;
}

async function createTask(input, id) {
  validateTaskInput(input);
  const tasks = await readTasks();
  const now = new Date().toISOString();
  const task = {
    id,
    title: input.title.trim(),
    description: (input.description || "").trim(),
    priority: input.priority || "medium",
    status: input.status || "pending",
    dueDate: input.dueDate || "",
    createdAt: now,
    updatedAt: now
  };
  tasks.push(task);
  await writeTasks(tasks);
  return task;
}

async function updateTask(id, input) {
  validateTaskInput(input, true);
  const tasks = await readTasks();
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) return null;

  const current = tasks[index];
  const updated = {
    ...current,
    ...(own(input, "title") ? { title: input.title.trim() } : {}),
    ...(own(input, "description") ? { description: input.description.trim() } : {}),
    ...(own(input, "priority") ? { priority: input.priority } : {}),
    ...(own(input, "status") ? { status: input.status } : {}),
    ...(own(input, "dueDate") ? { dueDate: input.dueDate || "" } : {}),
    updatedAt: new Date().toISOString()
  };

  tasks[index] = updated;
  await writeTasks(tasks);
  return updated;
}

async function deleteTask(id) {
  const tasks = await readTasks();
  const remaining = tasks.filter((task) => task.id !== id);
  if (remaining.length === tasks.length) return false;
  await writeTasks(remaining);
  return true;
}

module.exports = { listTasks, getTask, createTask, updateTask, deleteTask };
