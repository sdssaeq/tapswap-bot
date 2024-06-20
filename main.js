const { Worker } = require("worker_threads");
const fs = require("fs").promises;

async function getUsers() {
  try {
    const data = await fs.readFile("q.txt", "utf8");
    // Remove any carriage return characters and split by newline
    const users = data.replace(/\r/g, "").trim().split("\n");
    return users;
  } catch (err) {
    console.error("Error reading file:", err);
    return [];
  }
}

async function startWorkers() {
  const users = await getUsers();
  const workerStates = Array(users.length).fill(""); // Initialize an array to hold the state of each worker

  function printWorkerStates() {
    console.clear();
    // console.log(`${workerStates.length} Bots Running`);
    workerStates.forEach((state, index) => {
      console.log(`${state}`);
      return;
    });
  }

  users.forEach((user, index) => {
    const worker = new Worker("./worker.js", { workerData: user });
    worker.on("message", (message) => {
      workerStates[index] = message; // Update the state of the corresponding worker
      printWorkerStates();
    });
    worker.on("error", (error) =>
      console.error(`Worker ${index} error:`, error)
    );
    worker.on("exit", (code) => {
      if (code !== 0) {
        console.error(`Worker ${index} stopped with exit code ${code}`);
      }
    });
  });
}
startWorkers();
