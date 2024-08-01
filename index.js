const path = require("path");
const fs = require("fs");

const {EventEmitter} = require("events");
const htmlPath = path.resolve(__dirname, "index.html");
const execSync = require('child_process').execSync;
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
  return execSync(cmd)
}

app.use(express.static("public"));
app.use(express.json())

app.get("/", (req, res) => {
  res.send(rootHtml)
  
});



app.post("/:id", (req, res) => {
  const {id}=req.params
  const b=req.body
  if(id=='getSysData'){
    
    let out = execSync("uptime -p", { encoding: 'utf-8' })
    
    res.send({"data":out})
  }else{
    console.log(b)
    res.send(b)
  }

});

app.listen(5000, () => console.log("Server running at http://localhost:5000/"));
