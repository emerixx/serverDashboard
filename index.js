const path = require("path");
const fs = require("fs");

const {EventEmitter} = require("events");
const htmlPath = path.resolve(__dirname, "index.html");
const util = require('util')
const exec = util.promisify(require('child_process').exec)
const express = require("express");
const app = express();
const eventEmitter = new EventEmitter;

let rootHtml="";
let runCmdOut = "";

fs.readFile('./index.html', 'utf8', (err, html) => {
  if(err){
    console.error("Error occured while reading the root html file, exiting...\n" + err)
    process.exit()
  }else{
    rootHtml=html
  }
    

});

function runCmd(cmd){
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        reject();
      }
      runCmdOut = stdout;
      if(stderr) console.error(`stderr: ${stderr}`);
      
      resolve()
    });
  })
}

app.use(express.static("public"));
app.use(express.json())

app.get("/", (req, res) => {
  res.send(rootHtml)
  
});



app.post("/getSysData/:cmdReq", (req, res) => {
  const {cmdReq}=req.params
  //const b=req.body
  let cmd=''
  switch (cmdReq) {
    case "uptime":
      cmd="uptime -p"
      break;
  
    default:
      console.log("x")
      res.send({"out":"No Valid command"})
      break;
  }
  
  if(cmd){
    
    runCmd(cmd).then(()=>{
      console.log(runCmdOut)
      res.send({"out":runCmdOut})})
  }
  
  
});


app.listen(5000, () => console.log("Server running at http://localhost:5000/"));
