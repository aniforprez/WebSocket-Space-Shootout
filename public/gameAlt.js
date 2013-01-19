$(document).ready(function () {
	
	// Get all canvas attributes
	var canvas = $("#gameCanvas");
	var context = canvas.get(0).getContext("2d");
	canvas.attr("width", $(window).get(0).innerWidth);
	canvas.attr("height", $(window).get(0).innerHeight);
	$(window).resize(resizeCanvas);
	
	// Canvas dimensions
	var canvasWidth = canvas.width();
	var canvasHeight = canvas.height();

	// Resize canvas based on window dimensions
	function resizeCanvas() {
		canvas.attr("width", $(window).get(0).innerWidth);
		canvas.attr("height", $(window).get(0).innerHeight);
		context.fillRect(0, 0, canvas.width(), canvas.height());

		// Canvas dimensions
		var canvasWidth = canvas.width();
		var canvasHeight = canvas.height();
	}

	// Socket connection
	var socket;
	
	// Asteroid variable
	var asteroids;
	var asteroidMaxRad = 4;
	
	// Variable for bullets fired
	var bullets;
	var bulletVel = 30;
	var bulletLimit = 1200;
	var bulletTime = 0;
	
	// Player controls
	var arrowUp = 38;
	var arrowRight = 39;
	var arrowLeft = 37;
	var arrowDown = 40;
	var spacebar = 32;
	var moveUp = false;
	var moveRight = false;
	var moveLeft = false;
	var moveDown = false;
	var fireb = false;

	// World bounds
	var worldBound = 10000;
	
	// Coordinate offset functions
	function getOffsetCoordX(x) {
		return (x - locPlayr.x + (canvasWidth/2));
	}
	function getOffsetCoordY(y) {
		return (y - locPlayr.y + (canvasHeight/2));
	}

	// Class definition of player
	var Player = function (x, y) {
		this.x = x;
		this.y = y;
		this.angle = 0;
		this.maxVel = 40;
		this.vel = 0;
		this.velX = 0;
		this.velY = 0;
		this.flamelength = 0;
		this.health = 100;

		this.update = function() {
			if (moveUp) {
				if (this.vel < this.maxVel && !moveDown) {
					this.vel++;
				}
			}
			else {
				if (this.vel > 0) {
					this.vel--;
				}
			};
			
			if (moveDown) {
				if (this.vel > -this.maxVel && !moveUp) {
					this.vel--;
				}
			}
			else {
				if (this.vel < 0) {
					this.vel++;
				}
			};
			
			if (moveLeft && !moveRight) {
				this.angle-=3;
			}
			
			if (moveRight && !moveLeft) {
				this.angle+=3;
			}

			this.velX = this.vel * Math.cos(this.angle*(Math.PI/180));
			this.x += this.velX;
			if((this.x > 20) && (this.x < (worldBound-20))) { }
			else {
				if(this.x < 20 && this.velX < 0)
					this.x = 21;
				if(this.x > 2980 && this.velX > 0)
					this.x = (worldBound - 21);
				this.velX = 0;
			}

			this.velY = this.vel * Math.sin(this.angle*(Math.PI/180));
			this.y += this.velY;
			if((this.y > 20) && (this.y < (worldBound-20))) { }
			else {
				if(this.y < 20 && this.velY < 0)
					this.y = 21;
				if(this.y > 2980 && this.velY > 0)
					this.y = (worldBound-21);
				this.velY = 0;
			}
			socket.emit("move player", {id: this.id, x: this.x, y: this.y, angle: this.angle, health:this.health});
		};
		this.drawLocal = function() {
			context.save();
			context.globalAlpha = 1;
			context.shadowBlur = 0;
			context.fillStyle = "green";
			context.beginPath();
			context.translate((canvasWidth/2), (canvasHeight/2));
			context.moveTo(-15, -25);
			context.lineTo(-15 + (30 * (this.health/100)), -25);
			context.lineTo(-15 + (30 * (this.health/100)), -30);
			context.lineTo(-15, -30);
			context.closePath();
			context.fill();
			context.rotate(this.angle*(Math.PI/180));
			context.fillStyle = "#8FBC8F";
			context.beginPath();
			context.moveTo(10, 0);
			context.lineTo(-10, -10);
			context.lineTo(-10, +10);
			context.closePath();
			context.fill();
			if (moveUp) {
				if(this.flameLength < 20) {
					this.flameLength++;
				}
			}
			else {
				if(this.flameLength > 0) {
					this.flameLength--;
				}
			};
			if (this.flameLength == 20 && moveUp) {
				this.flameLength = 15;
			} 
			else if (moveUp) {
				this.flameLength = 20;
			};
			context.fillStyle = "orange";
			context.shadowColor = "yellow";
			context.shadowBlur = 10;
			context.beginPath();
			context.moveTo(-10, -3);
			context.lineTo(-this.flameLength-10, 0);
			context.lineTo(-10, 3);
			context.closePath();
			context.fill();
			context.restore();
			context.strokeStyle = "orange";
			context.lineWidth = 2;
			context.beginPath();
			context.globalAlpha = 1;
			context.shadowBlur = 0;
			context.arc(canvasWidth/2, canvasHeight/2, 20, 0, Math.PI*2, true);
			context.closePath();
			context.stroke();
		}
		this.drawRemote = function() {
			context.save();
			context.fillStyle = "rgb(20, 255, 20)";
			context.globalAlpha = 1;
			context.shadowBlur = 0;
			context.translate(getOffsetCoordX(this.x), getOffsetCoordY(this.y));
			context.rotate(this.angle*(Math.PI/180));
			context.beginPath();
			context.moveTo(10, 0);
			context.lineTo(-10, -10);
			context.lineTo(-10, +10);
			context.closePath();
			context.fill();
			context.strokeStyle = "orange";
			context.lineWidth = 2;
			context.beginPath();
			context.globalAlpha = 1;
			context.shadowBlur = 0;
			context.arc(0, 0, 20, 0, Math.PI*2, true);
			context.closePath();
			context.stroke();
			context.restore();
		}
		this.deathFunc = function() {
			this.x = (Math.random() * 2950) + 50;
			this.y = (Math.random() * 2950) + 50;
			this.health = 100;
		}
	};

	// Local player variable created
	var locPlayr = new Player((Math.random() * 2950) + 50, (Math.random() * 2950) + 50);

	// Remote Players variable array created. New remote players added to this array
	var remotePlayers = new Array();

	// Class definition of the asteroid
	var Asteroid = function (x, y, z, radius) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.radius = radius;

		this.update = function(velX, velY) {
			this.x -= velX / this.z;
			this.y -= velY / this.z;
			
			// Check statements to see if asteroids go beyond canvas and redraw them with different parameters to imitate sidescrolling action
			if (this.x + this.radius < -50) {
				this.radius = Math.random() * asteroidMaxRad;
				this.x = canvasWidth + this.radius;
				this.y = Math.floor(Math.random() * canvasHeight);
				while((pZ = Math.random() * 20) <= 1) {
				}
			};
			if (this.y + this.radius < -50) {
				this.radius = Math.random() * asteroidMaxRad;
				this.x = Math.floor(Math.random() * canvasWidth);
				this.y = canvasHeight + this.radius;
				while((pZ = Math.random() * 20) <= 1) {
				}
			};
			if (this.x + this.radius > (canvasWidth + 50)) {
				this.radius = Math.random() * asteroidMaxRad;
				this.x = -this.radius;
				this.y = Math.floor(Math.random() * canvasHeight);
				while((pZ = Math.random() * 20) <= 1) {
				}
			};
			if (this.y + this.radius > (canvasHeight + 50)) {
				this.radius = Math.random() * asteroidMaxRad;
				this.x = Math.floor(Math.random() * canvasWidth);
				this.y = -this.radius;
				while((pZ = Math.random() * 20) <= 1) {
				}
			};
			context.fillStyle = "rgb(255, 255, 255)";
			context.shadowColor = "rgb(255, 255, 255)";
			context.shadowBlur = 1;
			context.beginPath();
			context.globalAlpha = 1 - (this.z / 20);
			context.arc(this.x, this.y, this.radius, 0, Math.PI*2, true);
			context.closePath();
			context.fill();
		}
	};
	
	// Class definition of the bullets
	var Bullet = function (x, y, angle) {
		this.x = x;
		this.y = y;
		this.angle = angle;
		this.life = 20;		

		this.update = function() {
			this.life--;
			this.x += bulletVel * Math.cos(this.angle*(Math.PI/180)) + locPlayr.velX;
			this.y += bulletVel * Math.sin(this.angle*(Math.PI/180)) + locPlayr.velY;
			// this.offsetX += bulletVel * Math.cos(this.angle*(Math.PI/180));
			// this.offsetY += bulletVel * Math.sin(this.angle*(Math.PI/180));
			this.draw();
		}
		this.draw = function() {
			var offsetX = getOffsetCoordX(this.x),
				offsetY = getOffsetCoordY(this.y);
			context.fillStyle = "orange";
			context.beginPath();
			context.globalAlpha = 1;
			context.shadowBlur = 0;
			context.arc(offsetX, offsetY, 3, 0, Math.PI*2, true);
			context.closePath();
			context.fill();
		}
	};
	
	// Function to initialise all the asteroids, create bullet array
	function init() {
		var noOfAsteroids = 20;
		asteroids = new Array();
		var pX, pY, pZ, pRadius;
		for (var i = 0; i<50; i++) {
			pX = Math.random() * (canvasWidth);
			pY = Math.random() * (canvasHeight);
			while((pZ = Math.random() * 20) <= 1) {	}
			pRadius = Math.random() * asteroidMaxRad;
			asteroids.push(new Asteroid(pX, pY, pZ, pRadius));
		}
		bullets = new Array();
		socket = io.connect("http://localhost", {port: 8000, transports: ["websocket"]});
		setEventHandlers();
		animate();
	}
	
	// Keyboard key events
	$(window).keydown(function(e) {
		var keyCode = e.keyCode;
		if (keyCode == arrowRight) {
			moveRight = true;
		}
		if (keyCode == arrowUp) {
			moveUp = true;
		} 
		if (keyCode == arrowDown) {
			moveDown = true;
		}
		if (keyCode == arrowLeft) {
			moveLeft = true;
		}
		if (keyCode == spacebar) {
			fireb = true;
		}
	});
	$(window).keyup(function(e) {
		var keyCode = e.keyCode;
		if (keyCode == arrowRight) {
			moveRight = false;
		}
		if (keyCode == arrowUp) {
			moveUp = false;
		}
		if (keyCode == arrowDown) {
			moveDown = false;
		}
		if (keyCode == arrowLeft) {
			moveLeft = false;
		}
		if (keyCode == spacebar) {
			fireb = false;
			bulletTime = 0;
		}
	});
	
	// Animation loop that does all the fun stuff
	function animate() {
		context.clearRect(0, 0, canvasWidth, canvasHeight);
		context.strokeStyle = "rgb(255, 0, 0)";
		context.lineWidth = 3;
		context.shadowBlur = 0;
		context.globalAlpha = 1;
		context.beginPath();
		context.moveTo(getOffsetCoordX(0), getOffsetCoordY(0));
		context.lineTo(getOffsetCoordX(0), getOffsetCoordY(worldBound));
		context.lineTo(getOffsetCoordX(worldBound), getOffsetCoordY(worldBound));
		context.lineTo(getOffsetCoordX(worldBound), getOffsetCoordY(0));
		context.closePath();
		context.stroke();
		locPlayr.update();
		
		// If firing, create bullets at regular intervals
		if(fireb) {
			if(bulletTime == 0) {
			 	bullets.push(new Bullet(locPlayr.x, locPlayr.y, locPlayr.angle));
			 	
			}
			else {	
				if(bulletTime < bulletLimit)
					bulletTime++;
				else
					bulletTime = 0;
			}
		}

		// Update and draw the asteroids
		asteroids.forEach(function(asteroid) {
			asteroid.update(locPlayr.velX, locPlayr.velY);
		});
		
		// Calculate and draw the bullets
		bullets.forEach(function(bullet) {
			bullet.update();
			socket.emit("receive bullet", {x: bullet.x, y: bullet.y, id: locPlayr.id});
		});

		// Filter the bullets if they are dead i.e. their life has expired
		bullets = bullets.filter(function(bullet) {
			return (bullet.life>0);
		});

		// Draw the remote players
		remotePlayers.forEach(function(remotePlayer) {
			remotePlayer.drawRemote();
		});

		// Draw the player
		locPlayr.drawLocal();
		
		// Run the animation loop again in 33 milliseconds
		setTimeout(animate, 30);
	};

	// Socket event handlers
	var setEventHandlers = function() {
		// Socket connection successful
		socket.on("connect", onSocketConnected);

		// Socket disconnection
		socket.on("disconnect", onSocketDisconnect);

		// New player message received
		socket.on("new player", onNewPlayer);

		// Player move message received
		socket.on("move player", onMovePlayer);

		// Player removed message received
		socket.on("remove player", onRemovePlayer);

		// Player receives bullet data
		socket.on("get bullet", onGetBullet);

		// Player is dead
		socket.on("death", function() {
			locPlayr.deathFunc();
		});

		// Player is dead
		socket.on("player hit", function() {
			locPlayr.health -= 10;
		});

		socket.on("your id", function(data) {
			locPlayr.id = data.id;
		});
	};

	// Socket connected
	function onSocketConnected() {
		console.log("Connected to socket server");
		
		// Send local player data to the game server
		socket.emit("new player", {x: locPlayr.x, y: locPlayr.y, angle:locPlayr.angle});
	};

	// When new player data is received
	function onNewPlayer(data) {
		console.log("New player connected: "+data.id);

		// Initialise the new player
		var newPlayer = new Player(data.x, data.y);
		newPlayer.id = data.id;
		newPlayer.angle = data.angle;
		
		// Add new player to the remote players array
		remotePlayers.push(newPlayer);
	};

	// Move player
	function onMovePlayer(data) {
		var movePlayer = playerById(data.id);

		// Player not found
		if (!movePlayer) {
			console.log("Player not found: "+data.id);
			return;
		};

		// Update player position
		movePlayer.x = data.x;
		movePlayer.y = data.y;
		movePlayer.angle = data.angle;
		movePlayer.health = data.health;
	};

	// Remove player
	function onRemovePlayer(data) {
		var removePlayer = playerById(data.id);

		// Player not found
		if (!removePlayer) {
			console.log("Player not found: "+data.id);
			return;
		};
		
		// Remove player from array
		remotePlayers.splice(remotePlayers.indexOf(removePlayer), 1);
	};

	function onGetBullet(data)
	{
		var temp = new Bullet(data.x, data.y, 0);
		temp.draw();
	}

	// Socket disconnected
	function onSocketDisconnect() {
		console.log("Disconnected from socket server");
	};

	// Searches for player by id passed
	function playerById(id) {
		var i;
		for (i = 0; i < remotePlayers.length; i++) {
			if (remotePlayers[i].id == id)
				return remotePlayers[i];
		};
		return false;
	};

	// Initialise the entire game!!
	init();
});