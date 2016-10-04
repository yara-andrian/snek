var socketio = require('socket.io');
var http = require('http');
var startGame = require('./game');
var uuid = require('./uuid');
var nextColor = require('./colors');

var game;
var players = {};

module.exports = function(app) {

  var server = http.Server(app);
  var io = socketio(server);

  // A player joins the game
  io.sockets.on('connection', function(socket) {

    var player = {
      id: uuid(),
      socket: socket,
      color: nextColor(),
      name : "",
      points : 0
    };

    player.name = "Snake_" + player.id;

    players[player.id] = player;

    // welcome user, send them their snake color (may be user-changeble later)
    console.log('A user connected, giving it snake id', player.id);
    console.log('Number of players', Object.keys(players).length);

    // send in response to connecting:
    setTimeout(function(){
      socket.emit('gameSetup', {
        width: game.width,
        height: game.height,
        id: player.id,
        color: player.color,
        apples: game.apples,
        snakes: game.snakes,
        winLength : game.winLength,
      });
    },1000)

    // a client disconnects - we don't do much with that yet
    socket.on('disconnect', function(){
      io.emit('playerDisconnect', {
        id: player.id
      })
      game.removePlayer(player.id);
      delete players[player.id];
      console.log('Player left');
      console.log('Number of players', Object.keys(players).length);
    });

    socket.on('sendChat',function(data){
      console.log("Chat message from" + player.id);
      io.emit('newChat',{
        id: player.id,
        message: data.message
      });
    });

    socket.on('changeName',function(data){
      player.name = data.name;
      var snake = game.findPlayerSnake(player.id);
      snake.name = player.name;
    });

    //Receive admin command from a client
    socket.on('adminCommand',function(data){
      var command = data.command;
      if(command == "resetGame"){
        game.resetGame();
      }
      if(command == "cleanupGame"){
        game.cleanupGame();
      }
    });


    // client requests a new snake, server spawns a new snake
    socket.on('makeSnake', function() {
    	var data = {
        id: player.id,
        color: player.color,
        name : player.name
      };
      game.addSnake(data);
    });

    // client sends direction input to server, server broadcasts the player's move
    socket.on('direction', function(data){
      var snake = game.findPlayerSnake(player.id);
      if (snake) {
        snake.pushDirection(data.direction);
      }
    });

    socket.on('releaseDirection', function(data){
      var snake = game.findPlayerSnake(player.id);
      if (snake) {
        snake.releaseDirection(data.direction);
      }
    });

    // client drop a bomb on everyone
    socket.on('dropBomb', function() {
      var snake = game.findPlayerSnake(player.id);
      if (snake) {
        snake.eventQ.push("bomb");
      }
    });

    // client snake died... broadcast to all connected clients
    socket.on('died', function() {
      io.emit('killSnake', {
        id: player.id
      });
    });

    // ==== DEBUG SOCKET MESSAGES ====

    function noDebug() {
      return game.snakes.length!==1;
    }

    socket.on('generateDebugSnake', function(method) {
      if (noDebug()) return;

      var player = game.snakes[0];
      var d = game.addSnake({
        id: (Number.MAX_SAFE_INTEGER - game.snakes.length),
        color: 'rgba(255,255,255,0.2)',
        debug: true,
        moving: false
      });

      if (method==='fullsnake') {
        player.segments.forEach((segment,pos) => {
          d.segments[pos] = {
            x: game.width - segment.x,
            y: game.height - segment.y
          };
        });
      }

      if (method==='collisionsnake') {
        var dir = player.direction;

        if (dir === 'up' || dir === 'down') {
          player.segments.forEach((segment,pos) => {
            d.segments[pos] = {
              x: segment.x,
              y: game.height - segment.y
            };
          });
          d.direction = dir === 'up' ? 'down' : 'up';
        } else {
          player.segments.forEach((segment,pos) => {
            d.segments[pos] = {
              x: game.width - segment.x,
              y: segment.y
            };
          });
          d.direction = dir === 'left' ? 'right' : 'left';
        }

        d.moving = true;
        d.moveDebugSnake = true;
      }
    });

  });

  // and fire up a boring ol' server
  server.listen(process.env.PORT || 3000, function(){
    console.log('listening on *:3000');
    game = startGame(io,players);
  });
};
