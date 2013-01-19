/**************************************************
** GAME PLAYER CLASS
**************************************************/
var Player = function(startX, startY, startAngle) {
	this.x = startX;
	this.y = startY;
	this.angle = startAngle;
	this.health = 100;
	this.roomIn;
	this.id = 0;
};

// Export the Player class so you can use it in
// other files by using require("Player").Player
exports.Player = Player;