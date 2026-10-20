const express = require("express");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { listTasks, getTask, createTask, updateTask, deleteTask } = require("./src/task-service");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const publicDirectory = path.join(__dirname, "public");

app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));
app.use(express.static(publicDirectory));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "TaskFlow API" });
});

app.get("/api/tasks", async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      q: req.query.q
    };
    res.json(await listTasks(filters));
  } catch (error) {
    next(error);
  }
});

app.get("/api/tasks/:id", async (req, res, next) => {
  try {
    const task = await getTask(req.params.id);
    if (!task) return res.status(404).json({ error: "Tarefa não encontrada." });
    res.json(task);
  } catch (error) {
    next(error);
  }
});

app.post("/api/tasks", async (req, res, next) => {
  try {
    const task = await createTask(req.body, randomUUID());
    res.status(201).json(task);
  } catch (error) {
    if (error.statusCode === 400) return res.status(400).json({ error: error.message });
    next(error);
  }
});

app.patch("/api/tasks/:id", async (req, res, next) => {
  try {
    const task = await updateTask(req.params.id, req.body);
    if (!task) return res.status(404).json({ error: "Tarefa não encontrada." });
    res.json(task);
  } catch (error) {
    if (error.statusCode === 400) return res.status(400).json({ error: error.message });
    next(error);
  }
});

app.delete("/api/tasks/:id", async (req, res, next) => {
  try {
    const deleted = await deleteTask(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Tarefa não encontrada." });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Endpoint não encontrado." });
  }
  res.status(404).sendFile(path.join(publicDirectory, "index.html"));
});

app.use((error, _req, res, _next) => {
  console.error(error);
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ error: "JSON inválido no corpo da requisição." });
  }
  res.status(500).json({ error: "Ocorreu um erro interno. Tente novamente." });
});

app.listen(PORT, () => {
  console.log(`TaskFlow disponível em http://localhost:${PORT}`);
});
