const net = require("net");

const LRU = require("lru-cache");

let blockedSites = []; // We are saving all our blocked sites


const cache = new LRU({              //yaha cache define or uske attr
  max: 500,
  maxAge: 1000 * 60 * 60,
  length: (value, key) => value.length,
});

const server = net.createServer();


server.on("connection", (clientToProxySocket) => {      //yaha conn bnega phir wohi sara tls checking
  console.log("Client connected to proxy");

  clientToProxySocket.once("data", (data) => {
    let isTLSConnection = data.toString().indexOf("CONNECT") !== -1;
    let serverPort = 80;
    let serverAddress;

    if (isTLSConnection) {
      serverPort = 443;
      serverAddress = data
        .toString()
        .split("CONNECT")[1]
        .split(" ")[1]
        .split(":")[0];
    } else {
      serverAddress = data.toString().split("Host: ")[1].split("\r\n")[0];
    }

    if (blockedSites.includes(serverAddress)) {     //yaha content filtering hogi
      clientToProxySocket.write(
        "HTTP/1.1 403 Forbidden\r\nContent-Type: text/plain\r\n\r\nAccess to this site is forbidden"
      );
      clientToProxySocket.end();
      return;
    }

    console.log(`Requested server address: ${serverAddress}`);

    const cachedSite = cache.get(serverAddress); //yaha cache wala kaam

    if (cachedSite) {
      console.log("Site found in cache");
      clientToProxySocket.end(cachedSite);
      console.log("\n");
      console.log("Cached site content: ", cachedSite);  
      console.log("\n");
      console.log(cache.data);
      return;
    }

    

    let proxyToServerSocket = net.createConnection(
      {
        host: serverAddress,
        port: serverPort,
      },
      () => {
        console.log("Proxy to server set up");

        if (isTLSConnection) {
          clientToProxySocket.write("HTTP/1.1 200 OK\r\n\r\n");
        } else {
          proxyToServerSocket.write(data);
        }

        clientToProxySocket.pipe(proxyToServerSocket);  //pipe se mtlb wohi CN wala communication path ek treeke se
        proxyToServerSocket.pipe(clientToProxySocket);
      }
    );
/////////////////////////error checking////////////////////////////////////////////
    clientToProxySocket.on("error", (err) => {
      console.log("Client to proxy error");
      console.log(err);
      proxyToServerSocket.end();
    });

    proxyToServerSocket.on("error", (err) => {
      console.log("Proxy to server error");
      console.log(err);
      clientToProxySocket.end();
    });
///////////////////////////////////////////////////////////////////////////////////
    proxyToServerSocket.on("data", (data) => {  //yeh scene tb jb cache mai na mile or server send kre
      if (serverAddress !== "localhost") {
        console.log("Storing site in cache");
        console.log("CACHED DATA: ",data)
        cache.set(serverAddress, data);
      }
    });

    proxyToServerSocket.setTimeout(10000, () => {  //yeh bs check k server hi respond na kre
      console.log("Server request timed out");
      proxyToServerSocket.end();
      clientToProxySocket.end();
    });
  });
});

server.on("error", (err) => {
  console.log("Some internal server error occurred");
  console.log(err);
});

server.on("close", () => {
  console.log("Client disconnected");
});


server.listen(
  {
    host: "127.0.0.1",
    port: 8888,
  },
  () => {
    console.log("\nServer listening on 0.0.0.0:8888\n");
  }
);


// for us to display our website
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// Serve the HTML file to the client
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Handle the HTTP POST request to '/save_blocked_list.php'
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.post('/save_blocked_list.php', (req, res) => {
  const blockedList = req.body.blockedList;
  blockedSites = blockedList
  console.log(blockedList)

  res.send('List saved successfully');
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

