const path = require("path");
const fs = require("fs");

const { EventEmitter } = require("events");
const htmlPath = path.resolve(__dirname, "index.html");
const util = require("util");
const os = require("os");
const exec = util.promisify(require("child_process").exec);
const express = require("express");
const app = express();

const eventEmitter = new EventEmitter();

let uptime = '';
let rootHtml = '';
let runCmdOut = '';

let updateUptimeInterval = 5 * 60 * 1000; //5 minutes
let updateUptimeIntervalId = '';
let updateRamUsageInterval = 5 * 60 * 1000; //5 minutes
let updateRamUsageIntervalId  = '';
let freeRam = 0;
let totalRam = 0;
let usedRam = 0;

fs.readFile("./index.html", "utf8", (err, html) => {
  if (err) {
    console.error(
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
        console.error(`exec error: ${error}`);
        reject();
      }
      runCmdOut = stdout;
      if (stderr) console.error(`stderr: ${stderr}`);

      resolve();
    });
  });
}

function updateUpTime() {
  runCmd("uptime -p").then(() => {
    uptime = runCmdOut;
    console.log("updated up time, current up time: " + uptime);
  });
}
function updateRamUsage() {
  

  freeRam = os.freemem() / Math.pow(10, 9); //convert to GB
  totalRam = os.totalmem() / Math.pow(10, 9); // convert to GB
  usedRam = totalRam - freeRam;
  console.log("updated ram usage, current free RAM: " + freeRam + "GB, total RAM: " + totalRam + "GB, current used RAM: " + usedRam + "GB\n");
}
function updateTemp() {}

app.use(express.static("public"));
app.use(express.json());

app.get("/", (req, res) => {
  res.send(rootHtml);
});

app.post("/getSysData/:cmdReq", (req, res) => {
  const { cmdReq } = req.params;
  let cmd = "";
  switch (cmdReq) {
    case "uptime":
      cmd = "uptime -p";
      break;

    default:
      console.log("x");
      res.send({ out: "No Valid command" });
      break;
  }

  if (cmd) {
    runCmd(cmd).then(() => {
      console.log(runCmdOut);
      res.send({ out: runCmdOut });
    });
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
        console.log(
          "enabled getUpTime interval, current interval: " +
            updateUptimeInterval / 1000 +
            " seconds\n"
        );
        res.send({
          out:
            "enabled getUpTime interval, current interval: " +
            updateUptimeInterval / 1000 +
            " seconds",
        });
      } else {
        clearInterval(updateUptimeIntervalId);
        console.log("interupted getUpTime interval\n");
        res.send({ out: "interupted getUpTime interval" });
        updateUptimeIntervalId = "";
      }
      break;
      case "toggleUpdateRamUsage":
        if (updateRamUsageIntervalId == "") {
          updateRamUsageIntervalId = setInterval(function () {
            updateRamUsage();
          }, updateRamUsageInterval);
          console.log(
            "enabled getRamUsage interval, current interval: " +
            updateRamUsageInterval / 1000 +
              " seconds\n"
          );
          res.send({
            out:
              "enabled getRamUsage interval, current interval: " +
              updateRamUsageInterval / 1000 +
              " seconds",
          });
        } else {
          clearInterval(updateRamUsageIntervalId);
          console.log("interupted getRamUsage interval\n");
          res.send({ out: "interupted getRamUsage interval" });
          updateRamUsageIntervalId = "";
        }
        break;

    default:
      console.log("x");
      res.send({ out: "No Valid command" });
      break;
  }
});

console.log();
console.log((os.totalmem() - os.freemem()) / os.totalmem());
updateRamUsage()

app.listen(5000, () => console.log("Server running at http://localhost:5000/"));
