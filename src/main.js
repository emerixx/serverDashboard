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
const PORT = process.env.PORT || 80;
const logDir="/home/emerix/coding_projects/webDev/serverDashBoard/logs/"

let uptime = "";
let rootHtml = "";
let runCmdOut = "";

let updateUptimeInterval = 5 * 60 * 1000; //5 minutes
let updateUptimeIntervalId = "";
let updateRamUsageInterval = 5 * 60 * 1000; //5 minutes
let updateRamUsageIntervalId = "";
let updateTemperatureInterval = 5 * 60 * 1000; //5 minutes
let updateTemperatureIntervalId = "";
let freeRam = 0;
let totalRam = 0;
let usedRam = 0;
let temperature=0;

const mainLoggerFile = new winston.transports.File({
  filename: logDir+"main.log",
  datePattern: "DD-MM-YYYY",
});
const infoLoggerFile = new winston.transports.File({
  filename: logDir+"info.log",
  datePattern: "DD-MM-YYYY",
  level: "info",
});
const warnLoggerFile = new winston.transports.File({
  filename: logDir+"warn.log",
  datePattern: "DD-MM-YYYY",
  level: "warn",
});
const errorLoggerFile = new winston.transports.File({
  filename: logDir+"error.log",
  datePattern: "DD-MM-YYYY",
  level: "error",
});

const mainLoggerFilePlain = new winston.transports.File({
  filename: logDir+"plain/main.log",
  datePattern: "DD-MM-YYYY",
});
const infoLoggerFilePlain = new winston.transports.File({
  filename: logDir+"plain/info.log",
  datePattern: "DD-MM-YYYY",
  level: "info",
});
const warnLoggerFilePlain = new winston.transports.File({
  filename: logDir+"plain/warn.log",
  datePattern: "DD-MM-YYYY",
  level: "warn",
});
const errorLoggerFilePlain = new winston.transports.File({
  filename: logDir+"plain/error.log",
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
    consoleLogger.info(msg + " (clog)");
  },
  warn(msg) {
    consoleLogger.warn(msg + " (clog)");
  },
  error(msg) {
    consoleLogger.error(msg + " (clog)");
  },
};



fs.readFile("./src/index.html", "utf8", (err, html) => {
  if (err) {
    slog.error(
      "Error occured while reading the root html file, exiting..." + err
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
      if (stderr) {
        slog.error(`stderr while running command "${cmd}": ${stderr}`);
        reject();
      }
      runCmdOut = stdout
      resolve();
    });
  });
}

function updateUpTime() {
  runCmd("uptime -p").then(() => {
    uptime = runCmdOut.slice(3, runCmdOut.length-1);
;
    slog.info("updated up time, current up time: " + uptime);
  });
}
function updateRamUsage() {
  freeRam = +((os.freemem() / Math.pow(10, 9)).toFixed(3)); //convert to GB
  totalRam = +((os.totalmem() / Math.pow(10, 9)).toFixed(3)); // convert to GB
  usedRam = +((totalRam - freeRam).toFixed(3));
  slog.info(
    "updated ram usage, current free RAM: " +
      freeRam +
      "GB, total RAM: " +
      totalRam +
      "GB, current used RAM: " +
      usedRam +
      "GB"
  );
}
function updateTemperature() {

  fs.readFile("/sys/class/thermal/thermal_zone0/temp", "utf8", (err, temp) => {
    if (err) {
      slog.error(
        "Error occured while reading the temperature file, setting temperature to -1..." + err
      );
      temperature=-1
    } else {
      temperature=temp/1000;
      slog.info(`updated temperature, current temperature: ${temperature}°C`)
    }
  });
} 
app.use(express.static("./src"));
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
    case "RAM":
      let send= {
        out:freeRam+"GB",
        out1:totalRam+"GB",
        out2:usedRam+"GB"
      }
      res.send({ send });
      slog.info(`sending RAM usage data to client, sending: FM=${send.out}, TM=${send.out1}, UM=${send.out2}, ` );
      break;
    case "temperature":
      res.send({ out: temperature });
      slog.info("sending temperature to client, temperature: " + temperature + "°C");
      break;
    default:
      slog.warn(
        "getSysData post request failed, invalid command, command: " + cmdReq
      );
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
    case "toggleUpdateTemperature":
      if (updateTemperatureIntervalId == "") {
        updateTemperatureIntervalId = setInterval(function () {
          updateTemperature();
        }, updateTemperatureInterval);
        slog.info(
          "enabled getTemperature interval, current interval: " +
            updateTemperatureInterval / 1000 +
            " seconds"
        );
        res.send({
          out:
            "enabled getTemperature interval, current interval: " +
            updateTemperatureInterval / 1000 +
            " seconds",
        });
      } else {
        clearInterval(updateTemperatureIntervalId);
        slog.info("stopped getTemp interval");
        res.send({ out: "interupted getTemp interval" });
        updateTemperatureIntervalId = "";
      }
      break;


    default:
      slog.error(
        "config post request failed, invalid command, command: " + cmdReq
      );
      res.send({ out: "No Valid command" });
      break;
  }
});

updateUptimeIntervalId = setInterval(function () {
  updateUpTime();
}, updateUptimeInterval);
updateRamUsageIntervalId = setInterval(function () {
  updateRamUsage();
}, updateRamUsageInterval);
updateTemperatureIntervalId = setInterval(function () {
  updateTemperature();
}, updateTemperatureInterval);
updateRamUsage();
updateUpTime();
updateTemperature();


app.listen(PORT, () => slog.info("Started Server at localhost/" + PORT));
