$(document).ready(function() {
	var socket;
	var canvas = $("#mapCanvas");
	var context = canvas.get(0).getContext("2d");
	var players;
	var canvasWidth = canvas.width();
	var canvasHeight = canvas.height();
	function init() {
		socket = io.connect("http://localhost", {port: 8000, transports: ["websocket"]})
		socket.emit("map client", {});
		socket.on("connect", onSocketConnected);
		socket.on("player data", onPlayerData);
	}
	function drawMap() {
		context.clearRect(0, 0, canvasWidth, canvasHeight);
		context.font = "10px serif";
		players.forEach(function(player) {
			if(player.roomIn == 0)
				context.fillStyle = "black";
			if(player.roomIn == 1)
				context.fillStyle = "green";
			context.fillRect(player.x/10, (player.y * (600/10000)), 5, 5);
			var idNum = player.id;
			context.fillText("Player " + idNum.toString(), player.x/10, (player.y * (600/10000)) + 20);
		});
		context.strokeStyle = "red";
		context.beginPath();
		context.moveTo(0, 0);
		context.lineTo(0, canvasHeight);
		context.lineTo(canvasWidth, canvasHeight);
		context.lineTo(canvasWidth, 0);
		context.closePath();
		context.stroke();
	}
	function onSocketConnected() {
		socket.emit("map client", {});
	}
	function onPlayerData(data) {
		players = JSON.parse(data);
		drawMap();
	}
	init();
});