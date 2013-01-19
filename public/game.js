$(document).ready(function () {
	var canvas = $("#gameCanvas");
	var context = canvas.get(0).getContext("2d");
	canvas.attr("width", $(window).get(0).innerWidth);
	canvas.attr("height", $(window).get(0).innerHeight);
	$(window).resize(resizeCanvas);
	function resizeCanvas() {
		canvas.attr("width", $(window).get(0).innerWidth);
		canvas.attr("height", $(window).get(0).innerHeight);
		context.fillRect(0, 0, canvas.width(), canvas.height());
	}
	// Canvas dimensions
	var canvasWidth = canvas.width();
	var canvasHeight = canvas.height();

	// Asteroid variable
	var asteroids;
	var asteroidMaxRad = 7;
	
	// Player variables
	var playerVX;
	var playerVY;
	var playerMaxVX = 20;
	var playerMaxVY = 20;
	
	// Imaginary player controls
	var arrowUp = 38;
	var arrowRight = 39;
	var arrowLeft = 37;
	var arrowDown = 40;
	var moveUp = false;
	var moveRight = false;
	var moveLeft = false;
	var moveDown = false;
	
	// Class definition of the asteroid
	var Asteroid = function (x, y, z, radius) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.radius = radius;
	};
	
	
	function init() {
		playerVX = playerVY = 0;
		asteroids = new Array();
		var pX, pY, pZ, pRadius;
		for (var i = 0; i<50; i++) {
			pX = Math.random() * (canvasWidth);
			pY = Math.random() * (canvasHeight);
			while((pZ = Math.random() * 20) <= 1) {
			}
			pRadius = Math.random() * asteroidMaxRad;
			asteroids.push(new Asteroid(pX, pY, pZ, pRadius));
		}
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
	});
	
	// Animation loop that does all the fun stuff
	function animate() {
		context.clearRect(0, 0, canvasWidth, canvasHeight);
		
		if (moveUp) {
			if (playerVY > -playerMaxVY && !moveDown) {
				playerVY--;
			}
		}
		else {
			if (playerVY < 0) {
				playerVY++;
			}
		};
		
		if (moveDown) {
			if (playerVY < playerMaxVY && !moveUp) {
				playerVY++;
			}
		}
		else {
			if (playerVY > 0) {
				playerVY--;
			}
		};
		
		if (moveRight) {
			if (playerVX < playerMaxVX && !moveLeft) {
				playerVX++;
			}
		}
		else {
			if (playerVX > 0) {
				playerVX--;
			}
		};
		
		if (moveLeft) {
			if (playerVX > -playerMaxVX && !moveRight) {
				playerVX--;
			}
		}
		else {
			if (playerVX < 0) {
				playerVX++;
			}
		};
			
		for(var i = 0; i < asteroids.length; i++) {
			asteroids[i].x -= playerVX / asteroids[i].z;
			asteroids[i].y -= playerVY / asteroids[i].z;
			
			// Check statements to see if asteroids go beyond canvas and redraw them with different parameters to imitate sidescrolling action
			if (asteroids[i].x+asteroids[i].radius < -50) {
				asteroids[i].radius = Math.random()*asteroidMaxRad;
				asteroids[i].x = canvasWidth+asteroids[i].radius;
				asteroids[i].y = Math.floor(Math.random()*canvasHeight);
			};
			if (asteroids[i].y+asteroids[i].radius < -50) {
				asteroids[i].radius = Math.random()*asteroidMaxRad;
				asteroids[i].x = Math.floor(Math.random()*canvasWidth);
				asteroids[i].y = canvasHeight+asteroids[i].radius;
			};
			if (asteroids[i].x+asteroids[i].radius > (canvasWidth+50)) {
				asteroids[i].radius = Math.random()*asteroidMaxRad;
				asteroids[i].x = -asteroids[i].radius;
				asteroids[i].y = Math.floor(Math.random()*canvasHeight);
			};
			if (asteroids[i].y+asteroids[i].radius > (canvasHeight+50)) {
				asteroids[i].radius = Math.random()*asteroidMaxRad;
				asteroids[i].x = Math.floor(Math.random()*canvasWidth);
				asteroids[i].y = -asteroids[i].radius;
			};
			context.fillStyle = "rgb(255, 255, 255)";
			context.shadowColor = "rgb(255, 255, 255)";
			context.shadowBlur = 10;
			context.beginPath();
			context.globalAlpha = 1 - (asteroids[i].z / 20);
			context.arc(asteroids[i].x, asteroids[i].y, asteroids[i].radius, 0, Math.PI*2, true);
			context.closePath();
			context.fill();
		}
		// Run the animation loop again in 33 milliseconds
		setTimeout(animate, 30);
	};
	init();
});