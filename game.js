/**************************************************
** NODE.JS REQUIREMENTS
**************************************************/
var util = require("util"),					// Utility resources (logging, object inspection, etc)
	io = require("socket.io"),				// Socket.IO
	Player = require("./Player").Player;	// Player class


/**************************************************
** GAME VARIABLES
**************************************************/
var socket,		// Socket controller
	players,
	mapClient = 0,
	users = {};	// Array of connected players


/**************************************************
** GAME INITIALISATION
**************************************************/
function init() {
	// Create an empty array to store players
	players = [];

	// Set up Socket.IO to listen on port 8000
	socket = io.listen(8000);

	// Configure Socket.IO
	socket.configure(function() {
		// Only use WebSockets
		socket.set("transports", ["websocket"]);

		// Restrict log output
		socket.set("log level", 2);
	});

	// Start listening for events
	setEventHandlers();
};


/**************************************************
** GAME EVENT HANDLERS
**************************************************/
var setEventHandlers = function() {
	// Socket.IO
	socket.sockets.on("connection", onSocketConnection);
};

// New socket connection
function onSocketConnection(client) {
	util.log("New player has connected: "+client.id);

	users[client.id] = client;

	// Listen for client disconnected
	client.on("disconnect", onClientDisconnect);

	// Listen for new player message
	client.on("new player", onNewPlayer);

	// Listen for move player message
	client.on("move player", onMovePlayer);

	// Get bullets and broadcast xy position to all clients
	client.on("receive bullet", onReceiveBullet);

	// Get bullet collision
	client.on("player hit", onPlayerHit)

	// Get and store map client
	client.on("map client", function() {
		mapClient = this.id;
		setInterval(sendDataToMap, 100);
	});
};

// Socket client has disconnected
function onClientDisconnect() {
	util.log("Player has disconnected: "+this.id);

	var removePlayer = playerById(this.id);

	// Player not found
	if (!removePlayer) {
		util.log("Player not found: "+this.id);
		return;
	};

	// Remove player from players array
	players.splice(players.indexOf(removePlayer), 1);
	delete users[this.id];

	// Broadcast removed player to connected socket clients
	// this.broadcast.to(this.room).emit("remove player", {id: this.id});
	this.broadcast.emit("remove player", {id: this.id});
};

// New player has joined
function onNewPlayer(data) {
	// Create a new player
	var newPlayer = new Player(data.x, data.y, data.angle);
	newPlayer.id = this.id;
	this.emit("your id", {id: this.id})
	
	/*if(newPlayer.x > 5000)
	{
		this.join('room2');
		this.room = 'room2';
	}
	else
	{
		this.join('room1');
		this.room = 'room1';
	}
	newPlayer.roomIn = this.room;*/
	
	// Broadcast new player to connected socket clients
	// this.broadcast.to(this.room).emit("new player", {id: newPlayer.id, x: newPlayer.x, y: newPlayer.y, angle: newPlayer.angle});
	this.broadcast.emit("new player", {id: newPlayer.id, x: newPlayer.x, y: newPlayer.y, angle: newPlayer.angle});

	// Send existing players to the new player
	var i, existingPlayer;
	for (i = 0; i < players.length; i++) {
		/*if((players[i].roomIn == this.room))
		{
			existingPlayer = players[i];
			this.emit("new player", {id: existingPlayer.id, x: existingPlayer.x, y: existingPlayer.y, angle: existingPlayer.angle});
		}*/
		existingPlayer = players[i];
		this.emit("new player", {id: existingPlayer.id, x: existingPlayer.x, y: existingPlayer.y, angle: existingPlayer.angle});
	};
	
	//util.log("New player "+newPlayer.id+" at "+newPlayer.x+" in "+this.room);
	
	// Add new player to the players array
	players.push(newPlayer);
};

// Player has moved
function onMovePlayer(data) {
	// Find player in array
	var movePlayer = playerById(this.id);
	var temp = '';

	// Player not found
	if (!movePlayer) {
		util.log("Player not found: "+this.id);
		return;
	};

	// Update player position
	movePlayer.x = data.x;
	movePlayer.y = data.y;
	movePlayer.angle = data.angle;
	movePlayer.health = data.health;
	this.broadcast.emit("move player", {id: movePlayer.id, x: data.x, y: data.y, angle: data.angle, health: data.health});
};

function sortKdTree() {
	players.forEach(function(player) {
		player.join("room" + 1);
		for(var i=0; i<players.length; i++) {
			if(player.getDistance() < 650) {
				if(player.roomIn!=players[i].roomIn) {
					getPlayer(players[i], players[i].roomIn);
					this.room().emit(players);
				}
				else
					this.room().emit(player);
			}
		}
	});
};

function onReceiveBullet(data) {
	var brBull = this.broadcast;
	players.forEach(function(remotePlayer) {
		if(remotePlayer.id != data.id) {
			var dx = (remotePlayer.x - data.x) * (remotePlayer.x - data.x);
			var dy = (remotePlayer.y - data.y) * (remotePlayer.y - data.y);
			var dis = Math.sqrt(dx+dy);
			if(dis < 20) {
				users[remotePlayer.id].emit("player hit", {});
				remotePlayer.health -= 10;
				console.log("Player " + remotePlayer.id + " hit. Health:" +remotePlayer.health);
			}
			else {
				brBull.emit("get bullet", data);
			}
			
			if(remotePlayer.health <= 0) {
				users[remotePlayer.id].emit("death", {});
			}
		}
	});
};

function onPlayerHit(data) {
	var hitPlayer = playerById(data.id);
};

function sendDataToMap() {
	kdtree(0, 2, players, 0);
	users[mapClient].emit("player data", JSON.stringify(players));
};


/**************************************************
** GAME HELPER FUNCTIONS
**************************************************/
// Find player by ID
function playerById(id) {
	var i;
	for (i = 0; i < players.length; i++) {
		if (players[i].id == id)
			return players[i];
	};
	
	return false;
};

/*
 * Builds a kd-tree given an array of points
 */
var kdtree = function(id, numServer, points, depth) {
	var axis, median, node = {};

	if ((id + Math.pow(2,depth)) >= numServer) {
		
    	for(var i=0; i<points.length; i++) {
    		points[i].roomIn = id;
    	}
    	return 0;
    }

    if (!points || points.length == 0 ) return 0;

    // alternate between the axis
    axis = depth % points[0].length;

    // sort point array
    points.sort(function(a, b) {
        if (a.x == b.x) return a.y - b.y;
  			return a.x - b.x;
    }); 

    median = Math.floor(points.length / 2);

    // build and return node
    node.location = points[median];
    node.left = kdtree(id, numServer, points.slice(0, median), depth + 1);
    node.right = kdtree(id + Math.pow(2, depth) , numServer, points.slice(median), depth + 1);
    return node;
}

/**************************************************
** RUN THE GAME
**************************************************/
init();