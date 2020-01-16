var http = require("http");
var events = require("events");
const { fork } = require("child_process");
const child = fork("src/fibonacci");
const data = {};

var eventEmitter = new events.EventEmitter();

function onChildMessage(payload) {
  console.log(payload);
  data[payload.num + ""] = payload.value;
  eventEmitter.emit("result");
}

child.on("message", onChildMessage);

function runAction(n) {
  return new Promise(resolve => {
    eventEmitter.once("result", () => {
      console.log("action wins");
      resolve();
    });
    child.send({ num: n });
  });
}

function timeout() {
  return new Promise(resolve => {
    let timer = setTimeout(() => {
      console.log("timeout wins");
      resolve();
      clearTimeout(timer);
    }, 500);
  });
}

function onCreate(req, res) {
  let n = req.url.split("?")[1].split("=")[1];
  n = parseInt(n, 10);
  Promise.race([runAction(n), timeout()]).then(() => {
    res.write("result:" + JSON.stringify(data));
    res.end(); //end the response
  });
}

//create a server object:
http.createServer(onCreate).listen(8080); //the server object listens on port 8080
