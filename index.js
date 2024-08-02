const path = require("path");
const fs = require("fs");
const { EventEmitter } = require("events");
const htmlPath = path.resolve(__dirname, "index.html");
const util = require("util");
const os = require("os");
const exec = util.promisify(require("child_process").exec);
const express = require("express");
const winston = require("winston");
const { combine, timestamp, json, colorize, align, printf } = winston.format;
const app = express();
const logInConsole = true;
const eventEmitter = new EventEmitter();
const PORT=8080

let uptime = "";
let rootHtml = "";
let runCmdOut = "";

let updateUptimeInterval = 5 * 60 * 1000; //5 minutes
let updateUptimeIntervalId = "";
let updateRamUsageInterval = 5 * 60 * 1000; //5 minutes
let updateRamUsageIntervalId = "";
let freeRam = 0;
let totalRam = 0;
let usedRam = 0;

const mainLoggerFile = new winston.transports.File({
  filename: "./logs/main.log",
  datePattern: "DD-MM-YYYY",
});
const infoLoggerFile = new winston.transports.File({
  filename: "./logs/info.log",
  datePattern: "DD-MM-YYYY",
  level: "info",
});
const warnLoggerFile = new winston.transports.File({
  filename: "./logs/warn.log",
  datePattern: "DD-MM-YYYY",
  level: "warn",
});
const errorLoggerFile = new winston.transports.File({
  filename: "./logs/error.log",
  datePattern: "DD-MM-YYYY",
  level: "error",
});

const mainLoggerFilePlain = new winston.transports.File({
  filename: "./logs/plain/main.log",
  datePattern: "DD-MM-YYYY",
});
const infoLoggerFilePlain = new winston.transports.File({
  filename: "./logs/plain/info.log",
  datePattern: "DD-MM-YYYY",
  level: "info",
});
const warnLoggerFilePlain = new winston.transports.File({
  filename: "./logs/plain/warn.log",
  datePattern: "DD-MM-YYYY",
  level: "warn",
});
const errorLoggerFilePlain = new winston.transports.File({
  filename: "./logs/plain/error.log",
  datePattern: "DD-MM-YYYY",
  level: "error",
});

const consoleLogger = winston.createLogger({
  level: "info",

  format: combine(
    colorize({ all: true }),
    timestamp({
      format: "HH:mm:ss",
    }),
    align(),
    printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
  ),
  transports: [new winston.transports.Console()],
});

const fileLogger = winston.createLogger({
  level: "info",
  format: combine(
    colorize({ all: true }),
    timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    align(),
    printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
  ),
  transports: [
    new winston.transports.File(errorLoggerFile),
    new winston.transports.File(warnLoggerFile),
    new winston.transports.File(infoLoggerFile),
    new winston.transports.File(mainLoggerFile),
  ],
});
const plainFileLogger = winston.createLogger({
  level: "info",
  format: combine(
    timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    align(),
    printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`)
  ),
  transports: [
    new winston.transports.File(errorLoggerFilePlain),
    new winston.transports.File(warnLoggerFilePlain),
    new winston.transports.File(infoLoggerFilePlain),
    new winston.transports.File(mainLoggerFilePlain),
  ],
});

const slog = {
  info(msg) {
    if (logInConsole) {
      consoleLogger.info(msg);
    } else {
      fileLogger.info(msg);
      plainFileLogger.info(msg);
    }
  },
  warn(msg) {
    if (logInConsole) {
      consoleLogger.warn(msg);
    } else {
      fileLogger.warn(msg);
      plainFileLogger.warn(msg);
    }
  },
  error(msg) {
    if (logInConsole) {
      consoleLogger.error(msg);
    } else {
      fileLogger.error(msg);
      plainFileLogger.error(msg);
    }
  },
};
const clog = {
  info(msg) {
    consoleLogger.info(msg);
  },
  warn(msg) {
    consoleLogger.warn(msg);
  },
  error(msg) {
    consoleLogger.error(msg);
  },
};

fs.readFile("./index.html", "utf8", (err, html) => {
  if (err) {
    slog.error(
      "Error occured while reading the root html file, exiting...\n" + err
    );
    process.exit();
  } else {
    rootHtml = html;
  }
});

function runCmd(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        slog.error(`exec error while running command "${cmd}" : ${error}`);
        reject();
      }
      slog.info(stdout);
      runCmdOut = stdout;

      if (stderr) slog.error(`stderr while running command "${cmd}": ${stderr}`);

      resolve();
    });
  });
}

function updateUpTime() {
  runCmd("uptime -p").then(() => {
    uptime = runCmdOut;
    slog.info("updated up time, current up time: " + uptime);
  });
}
function updateRamUsage() {
  freeRam = os.freemem() / Math.pow(10, 9); //convert to GB
  totalRam = os.totalmem() / Math.pow(10, 9); // convert to GB
  usedRam = totalRam - freeRam;
  slog.info(
    "updated ram usage, current free RAM: " +
      freeRam +
      "GB, total RAM: " +
      totalRam +
      "GB, current used RAM: " +
      usedRam +
      "GB\n"
  );
}
function updateTemp() {}

app.use(express.static("public"));
app.use(express.json());

app.get("/", (req, res) => {
  res.send(rootHtml);
});

app.post("/getSysData/:cmdReq", (req, res) => {
  const { cmdReq } = req.params;

  switch (cmdReq) {
    case "uptime":
      res.send({ out: uptime });
      slog.info("sending uptime to client, uptime: " + uptime);
      break;

    default:
      slog.warn("getSysData post request failed, invalid command, command: " + cmdReq);
      res.send({ out: "No Valid command" });
      break;
  }
});

app.post("/config/:cmdReq", (req, res) => {
  const { cmdReq } = req.params;

  let cmd = "";
  switch (cmdReq) {
    case "toggleUpdateUptime":
      if (updateUptimeIntervalId == "") {
        updateUptimeIntervalId = setInterval(function () {
          updateUpTime();
        }, updateUptimeInterval);
        slog.info(
          "enabled getUpTime interval, current interval: " +
            updateUptimeInterval / 1000 +
            " seconds"
        );
        res.send({
          out:
            "enabled getUpTime interval, current interval: " +
            updateUptimeInterval / 1000 +
            " seconds",
        });
      } else {
        clearInterval(updateUptimeIntervalId);
        slog.info("stopped getUpTime interval");
        res.send({ out: "interupted getUpTime interval" });
        updateUptimeIntervalId = "";
      }
      break;
    case "toggleUpdateRamUsage":
      if (updateRamUsageIntervalId == "") {
        updateRamUsageIntervalId = setInterval(function () {
          updateRamUsage();
        }, updateRamUsageInterval);
        slog.info(
          "enabled getRamUsage interval, current interval: " +
            updateRamUsageInterval / 1000 +
            " seconds"
        );
        res.send({
          out:
            "enabled getRamUsage interval, current interval: " +
            updateRamUsageInterval / 1000 +
            " seconds",
        });
      } else {
        clearInterval(updateRamUsageIntervalId);
        slog.info("stopped getRamUsage interval");
        res.send({ out: "interupted getRamUsage interval" });
        updateRamUsageIntervalId = "";
      }
      break;

    default:
      slog.error("config post request failed, invalid command, command: " + cmdReq);
      res.send({ out: "No Valid command" });
      break;
  }
});


updateRamUsage();
updateUpTime();

app.listen(8080, () => slog.info("Started Server at localhost/"+PORT));
