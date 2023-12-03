const http = require('http')
const express = require('express')
const cors = require('cors');
const Timer = require('./Timer')
const Game = require('./Game')
const socketIO = require('socket.io');
const { generateId } = require('./helpers')
const mongoose = require('mongoose');
const app = express()
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
  },
});
const bodyParser = require('body-parser');
// const app = express();
app.use(bodyParser.json());
app.use(cors());
// app.use(cors());
const DB_URL = 'mongodb://0.0.0.0/chess';

mongoose.connect(DB_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const conn = mongoose.connection;
const User = require('./User');
conn.once('open', () => {
    console.log("***********Mongo DB connected**********");
});
app.post('/join', async (req, res) => {
  const { username, gameId, status } = req.body;

  try {
    let user = await User.findOne({ username });

    if (user) {
      // If the user already exists, update their status to 'active'
      user = await User.findOneAndUpdate(
        { username },
        { gameId, status: 'Active' },
        { new: true }
      );
    } else {
      // If the user does not exist, create a new user
      user = await User.create({ username, gameId, status });
    }

    res.status(201).json({ success: true, user });
  } catch (error) {
    console.error("Error creating/updating user:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

app.post('/leave', async (req, res) => {
  const { username } = req.body;

  try {
    const user = await User.findOneAndUpdate(
      { username },
      { status: 'inactive' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});





let games = []

let waitlistGameId;

let users = []
let dev_users = {}

io.on('connection', socket => {
  const playerId = socket.handshake.query.id
  let currentGameId;
  let username;

  socket.on('username', _username => {
    console.log('socket username')
    if (!_username) return
    username = _username
    dev_users[playerId] = { username: _username, inGame: false }
  })

  console.log("Client connected: " + playerId)
  function createGame(options) {
    let id = options && options.id || generateId()
    let game = new Game(options && options.isPublic)
    games.push(game)
    socket.emit('game id', game.id)
    return game.id
  }

  function joinGame(gameId, username) {
    if (!username) username = "Guest"
    let gameIndex = games.findIndex(g => g.id === gameId)
    if (gameIndex === -1) return socket.emit('leave')
    let game = games[gameIndex]
    socket.join(game.id)
    let joined = game.join(playerId, username)
    if (!joined) return socket.emit('leave')
    currentGameId = game.id
    game.onGameOver = function(data) {
      console.log('the game is over')
      io.in(currentGameId).emit('gameover', data)
    }
    socket.emit('game', game.data())
    if (game.players.length === 2) {
      game.start()
      io.in(currentGameId).emit('players', game.players)
    }
  }

  function leave() {
    let gameIndex = games.findIndex(g => g.id === currentGameId)
    if (gameIndex === -1) return
    let game = games[gameIndex]
    let pIndex = game.players.findIndex(p => p.id === playerId)
    game.active[pIndex] = false
    games = games.filter(g => g.active.find(a => !!a))
    if (currentGameId === waitlistGameId) {
      waitlistGameId = null // make sure someone joining the waitlist doesn't get paired with someone who has already left
    }
    socket.leaveAll()
    socket.broadcast.to(currentGameId).emit('player left')
    currentGameId = null
  }

  socket.on('create', data => {
    console.log('socket create')
    createGame(data)
  })

  socket.on('join game', (id, username) => {
    console.log('socket join')
    joinGame(id, username)

  })

  socket.on('waitlist', _username => {
    console.log('socket wait')
    if (waitlistGameId) {
      socket.emit('game id', waitlistGameId)
      console.log('User ' + _username + ' joined game as black')
      waitlistGameId = null
    } else {
      console.log('User ' + _username + ' joined game as white')
      waitlistGameId = createGame({ isPublic: true })
    }
  })

  socket.on('gameover', data => {
    console.log('socket gameover')
    let gameIndex = games.findIndex(g => g.id === currentGameId)
    if (gameIndex === -1) return
    let game = games[gameIndex]
    game.setGameOver(data)
  })

  socket.on('move', (move, sentAt) => {
    console.log('socket move')
    let gameIndex = games.findIndex(g => g.id === currentGameId)
    if (gameIndex === -1) return
    let game = games[gameIndex]
    game.move(move, sentAt)
    socket.broadcast.to(currentGameId).emit('move', move, Date.now())
    io.in(currentGameId).emit('time-left', game.timer.time, Date.now())
  })

  socket.on('message', (data) => {
    console.log('socket message')
    socket.broadcast.to(currentGameId).emit('message', data)
  })

  socket.on('rematch', gameId => {
    console.log('socket rematch')
    let gameIndex = games.findIndex(g => g.id === currentGameId)
    if (gameIndex === -1) return
    let game = games[gameIndex]
    if (game.rematch) {
      game.rematch = null
      game.runRematch()
      game.start()
      io.in(gameId).emit('game', game.data())
    } else {
      game.rematch = playerId
    }
  })

  socket.on('leave', () => {
    console.log('socket leave')
    leave()
  })


  socket.on('disconnect', () => {
    console.log('socket disconnect')
    console.log("Client disconnected: " + playerId, username)
    leave()
    delete dev_users[playerId]
  })

})
setInterval(() => {
  io.emit('get-users', Object.values(dev_users))
  io.emit('get-games', games.filter(g => g.players.length === 2).length)
}, 200)
server.listen(8000, () => {
  console.log(`Server listening on port ${8000}`);
});