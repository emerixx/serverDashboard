const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const htmlPath = path.resolve(__dirname, "index.html");

const express = require("express");
const app = express();

let htmlFile = "";

function runCommand(cmd) {
  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
}

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(htmlPath);
});

app.get("/", (req, res) => {
  res.send("root");
});
app.get("/test", (req, res) => {
  runCommand("touch hjjjh")
  res.send("test");
});

app.listen(5000, () => console.log("Server running at http://localhost:5000/"));
