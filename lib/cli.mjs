// lib/cli.mjs
import readline from "readline";
import fs from "fs";
import path from "path";

const ARGS = process.argv.slice(2);
const IS_DEBUG = ARGS.includes("--debug") || ARGS.includes("--verbose");

export const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

// Regex to strip ANSI codes for log file
const stripAnsi = (str) => str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");

export class CLI {
  constructor() {
    this.spinnerInterval = null;
    this.logStream = null;
  }

  /**
   * Initialize a write stream for the log file
   */
  initLog(filename) {
    const logPath = path.resolve(process.cwd(), filename);
    // Clear old log
    if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
    this.logStream = fs.createWriteStream(logPath, { flags: 'a' });
    this.fileLog("INIT", `Log started at ${new Date().toISOString()}`);
    this.info(`Verbose logs being written to: ${COLORS.dim}${filename}${COLORS.reset}`);
  }

  fileLog(level, msg) {
    if (this.logStream) {
      const timestamp = new Date().toISOString().split('T')[1].replace('Z', '');
      const cleanMsg = stripAnsi(String(msg));
      this.logStream.write(`[${timestamp}] [${level.padEnd(5)}] ${cleanMsg}\n`);
    }
  }

  log(msg) {
    console.log(msg);
    this.fileLog("LOG", msg);
  }

  debug(msg, data) {
    this.fileLog("DEBUG", `${msg} ${data ? JSON.stringify(data) : ''}`);
    if (IS_DEBUG) {
      console.log(`${COLORS.dim}[DEBUG] ${msg}${COLORS.reset}`, data || "");
    }
  }

  info(msg) {
    this.fileLog("INFO", msg);
    console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`);
  }

  success(msg) {
    this.fileLog("OK", msg);
    console.log(`${COLORS.green}✔${COLORS.reset} ${msg}`);
  }

  warn(msg) {
    this.fileLog("WARN", msg);
    console.log(`${COLORS.yellow}⚠ ${msg}${COLORS.reset}`);
  }

  error(msg, err) {
    this.fileLog("ERROR", `${msg} ${err ? err.message : ''}`);
    console.error(`${COLORS.red}✖ ${msg}${COLORS.reset}`);
    if (err) {
      if (IS_DEBUG) console.error(err);
      if (this.logStream) this.logStream.write(JSON.stringify(err, null, 2) + "\n");
    }
  }

  header(msg) {
    this.fileLog("SECTION", `=== ${msg} ===`);
    console.log(`\n${COLORS.bright}${COLORS.cyan}=== ${msg} ===${COLORS.reset}\n`);
  }

  subHeader(msg) {
    this.fileLog("SUB", msg);
    console.log(`${COLORS.dim}  ${msg}${COLORS.reset}`);
  }

  startSpinner(msg) {
    if (this.spinnerInterval) clearInterval(this.spinnerInterval);
    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let i = 0;
    process.stdout.write("\x1B[?25l"); // Hide cursor
    process.stdout.write(`  ${msg}`);

    this.spinnerInterval = setInterval(() => {
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`${COLORS.cyan}${frames[i]}${COLORS.reset} ${msg}`);
      i = (i + 1) % frames.length;
    }, 80);
  }

  stopSpinner(success = true, endMsg) {
    if (this.spinnerInterval) {
      clearInterval(this.spinnerInterval);
      this.spinnerInterval = null;
    }
    readline.cursorTo(process.stdout, 0);
    readline.clearLine(process.stdout, 0);
    process.stdout.write("\x1B[?25h"); // Show cursor
    if (endMsg) {
      if (success) this.success(endMsg);
      else this.error(endMsg);
    }
  }

  progressBar(current, total, operation, details = "") {
    const width = 20; // smaller bar to fit details
    const percentage = Math.round((current / total) * 100);
    const completed = Math.round((width * current) / total);
    
    const safeCompleted = isNaN(completed) ? 0 : completed;
    
    const bar =
      COLORS.green + "█".repeat(safeCompleted) +
      COLORS.dim + "░".repeat(width - safeCompleted) + COLORS.reset;

    readline.cursorTo(process.stdout, 0);
    readline.clearLine(process.stdout, 0); // Clear line to prevent text artifacts
    
    // Format: Downloading [██░░] 50% (1/2) - icon-name.svg
    let output = `${operation} [${bar}] ${percentage}% (${current}/${total})`;
    if (details) {
      output += ` - ${COLORS.cyan}${details}${COLORS.reset}`;
    }

    process.stdout.write(output);

    if (current >= total) {
      process.stdout.write("\n");
      this.fileLog("PROGRESS", `${operation} Complete`);
    }
  }

  async waitForKeyWithTimeout(timeoutMs, message) {
    return new Promise((resolve) => {
      let resolved = false;
      let timeLeft = timeoutMs / 1000;

      const timer = setInterval(() => {
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`${COLORS.yellow}⚠ ${message} (${Math.ceil(timeLeft)}s)...${COLORS.reset}`);
        timeLeft -= 0.1;
      }, 100);

      const cleanup = () => {
        clearInterval(timer);
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeAllListeners("data");
        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout, 0);
      };

      const onData = () => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(true);
        }
      };

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          cleanup();
          resolve(false);
        }
      }, timeoutMs);

      if (process.stdin.isTTY) process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on("data", onData);
    });
  }
}