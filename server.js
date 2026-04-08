const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let rooms = {};

function generateCode(){
  const chars="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code="";
  for(let i=0;i<5;i++){
    code+=chars[Math.floor(Math.random()*chars.length)];
  }
  return code;
}

io.on("connection", (socket) => {

  socket.on("createRoom", ()=>{
    const code = generateCode();
    rooms[code] = {};
    socket.join(code);
    socket.room = code;

    socket.emit("roomCreated", code);
  });

  socket.on("joinRoom", ({code, team})=>{
    if(!rooms[code]) return socket.emit("errorRoom");

    socket.join(code);
    socket.room = code;

    rooms[code][socket.id] = {
      x:0,y:1,z:0,
      team: team
    };

    socket.emit("joined", {code, players: rooms[code]});

    socket.to(code).emit("newPlayer", {
      id: socket.id,
      data: rooms[code][socket.id]
    });
  });

  socket.on("move",(data)=>{
    if(!socket.room) return;

    if(rooms[socket.room][socket.id]){
      rooms[socket.room][socket.id] = {
        ...rooms[socket.room][socket.id],
        ...data
      };

      socket.to(socket.room).emit("playerMove",{
        id: socket.id,
        ...rooms[socket.room][socket.id]
      });
    }
  });

  socket.on("disconnect",()=>{
    if(socket.room && rooms[socket.room]){
      delete rooms[socket.room][socket.id];
      socket.to(socket.room).emit("playerLeft",socket.id);
    }
  });

});

server.listen(3000,()=>console.log("http://localhost:3000"));
