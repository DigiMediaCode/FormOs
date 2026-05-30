const { spawn } = require("node:child_process");

const port = process.env.PORT || "3001";
const child = spawn("npx", ["next", "start", "-H", "0.0.0.0", "-p", port], {
  shell: true,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code || 0);
});
