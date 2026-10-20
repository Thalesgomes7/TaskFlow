const fs = require("node:fs/promises");
const path = require("node:path");

const dataDirectory = path.join(__dirname, "..", "data");
const dataFile = path.join(dataDirectory, "tasks.json");

async function ensureDataFile() {
  await fs.mkdir(dataDirectory, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, "[]\n", "utf8");
  }
}

async function readTasks() {
  await ensureDataFile();
  const content = await fs.readFile(dataFile, "utf8");
  const tasks = JSON.parse(content);
  if (!Array.isArray(tasks)) throw new Error("O arquivo de tarefas deve conter uma lista.");
  return tasks;
}

async function writeTasks(tasks) {
  await ensureDataFile();
  const temporaryFile = `${dataFile}.tmp`;
  await fs.writeFile(temporaryFile, `${JSON.stringify(tasks, null, 2)}\n`, "utf8");
  await fs.rename(temporaryFile, dataFile);
}

module.exports = { readTasks, writeTasks };
