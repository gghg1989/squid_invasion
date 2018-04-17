var enemies = {
	straight: { x: 0, y: -50, sprite: "enemy_hat", health: 10, E: 80, fireOdds:0.003},
	ltr: 	{ x: 0, y: -100, sprite: "enemy_left", health: 30, B: 75, C: 1, E: 100},
	circle:	{ x: 250, y: -50, sprite: "enemy_right", health: 30, A: 0, B: -100, C: 4, E: 10, F: 200, G: 1, H: Math.PI/2, fireOdds:0.007},
	wiggle:	{ x: 100, y: -50, sprite: "enemy_pound", health: 20, B: 50, C: 4, E: 100, missiles:2, fireOdds:0.002},
	step: 	{ x: 0, y: -50, sprite: "enemy_hat", health: 10, B: 150, C: 1.2, E: 75, fireOdds:0.02}
};
var OBJECT_PLAYER = 1,
	OBJECT_PLAYER_PROJECTILE = 2,   
	OBJECT_ENEMY = 4,
	OBJECT_ENEMY_PROJECTILE = 8,
	OBJECT_POWERUP = 16;

var sprites = {
	ship: { sx:0, sy:0, w:32, h:16, frames:0 },
	missile: { sx:160, sy:0, w:6, h:13, frames:0 },
	enemy_left: { sx:32, sy:0, w:32, h:32, frames:0 },
	enemy_pound: { sx:64, sy:0, w:32, h:32, frames:0 },
	enemy_hat: { sx:96, sy:0, w:32, h:32, frames:0 },
	enemy_right: { sx:128, sy:0, w:32, h:32, frames:0 },
	explosion: { sx:0, sy:32, w:63, h:63, frames:12},
	enemy_missile: {sx:166, sy:0, w:6, h:13, frames:0 }
};



var level1= [
	[0, 4000, 500, "step"],
	[ 6000, 13000, 800, "ltr" ],
	[ 12000, 16000, 400, "circle" ],
	[ 18200, 20000, 500, "straight", { x: 50 } ],
	[ 18400, 20000, 500, "straight", { x: 90 } ],
	[ 18000, 20000, 500, "straight", { x: 10 } ],
	[ 22000, 25000, 400, "wiggle", { x: 150 }],
	[ 22000, 25000, 400, "wiggle", { x: 100 }]
];

var startGame = function() {
	Game.setBoard(0, new Starfield(20, 0.4, 100, true));
	Game.setBoard(1, new Starfield(50, 0.6, 100));
	Game.setBoard(2, new Starfield(100, 1, 50));
	Game.setBoard(3, new TitleScreen("Squid Invasion", "Press fire to start playing", playGame));
}


var playGame = function() {
	var board = new GameBoard();
	board.add(new Level(level1, winGame));
	board.add(new PlayerShip());
	Game.setBoard(3, board);
	Game.setBoard(5, new GamePoints(0));
};

var winGame = function() {
	Game.setBoard(3, new TitleScreen("You Win!", "Press fire to play again", playGame));
};
var loseGame = function() {
	Game.setBoard(3, new TitleScreen("You Lose!", "Press fire to play again", playGame));
};
window.addEventListener("load", function() {

		Game.initialize("game", sprites, startGame);
		
	}
);

var Starfield = function(speed, opacity, numStars, clear){

	var stars = document.createElement("Canvas");
	stars.width = Game.width;
	stars.height = Game.height;
	
	var starCtx = stars.getContext("2d");
	var offset = 0;
	
	if(clear) {
		starCtx.fillStyle = "#035aea";
		starCtx.fillRect(0, 0, stars.width, stars.height);
	}
	
	starCtx.fillStyle = "#FFF";
	starCtx.globalAlpha = opacity;
	for(var i=0; i<numStars; i++) {
		starCtx.fillStyle = getRandomColor();
		starCtx.fillRect(
			Math.floor(Math.random()*stars.width),
			Math.floor(Math.random()*stars.height),
			4,4);
	}
	
	this.draw = function(ctx) {
		var intOffset = Math.floor(offset);
		var remaining = stars.height - intOffset;
		if(intOffset > 0) {
			ctx.drawImage(stars,
				0,remaining,
				stars.width, intOffset,
				0,0,
				stars.width, intOffset);
		}
		if(remaining > 0) {
			ctx.drawImage(stars,
				0, 0,
				stars.width, remaining,
				0, intOffset,
				stars.width, remaining);
		}
	}
	
	this.step = function(dt) {
		offset += dt * speed;
		offset = offset % stars.height;
	}
}

var PlayerShip = function() {
	this.setup("ship", {vx:0, fireInterval:0.25, maxVel:200});
	this.x = Game.width/2 - this.w/2;
	this.y = Game.height - Game.playerOffset - this.h;
	this.health = 10;
	
	this.firing = this.fireInterval;

	this.step = function(dt) {
		this.step = function(dt) {
			if (Game.keys["left"])
				this.vx = -this.maxVel;
			else if (Game.keys["right"])
				this.vx = this.maxVel;
			else
				this.vx = 0;
			
			this.x += this.vx * dt;
			
			if (this.x<0)
				this.x = 0;
			else if (this.x>Game.width - this.w)
				this.x = Game.width - this.w;
				
			this.firing -= dt;
			if (Game.keys["fire"] && this.firing<0) {
				Game.keys["fire"] = false;
				this.firing = this.fireInterval;
				this.board.add(new PlayerMissile(this.x, this.y+this.h/2));
				this.board.add(new PlayerMissile(this.x+this.w, this.y+this.h/2));
			}
		}
	}
}
PlayerShip.prototype = new Sprite();
PlayerShip.prototype.type = OBJECT_PLAYER;

PlayerShip.prototype.hit = function(damage) {
	if(this.board.remove(this)) {
		loseGame();
	}
}
var PlayerMissile = function(x,y) {
	this.setup("missile",{vy:-700, damage:10});
	this.x = x - this.w/2;
	this.y = y - this.h;
};
PlayerMissile.prototype = new Sprite();
PlayerMissile.prototype.type = OBJECT_PLAYER_PROJECTILE;

PlayerMissile.prototype.step = function(dt) {
	this.y += this.vy * dt;
	var collision = this.board.collide(this, OBJECT_ENEMY);
	if(collision) {
		collision.hit(this.damage);
		this.board.remove(this);
	}else if(this.y < -this.h)
		this.board.remove(this);
}

PlayerMissile.prototype.draw = function(ctx) {
	SpriteSheet.draw(ctx, "missile", this.x, this.y);
}

var Enemy = function(blueprint,override) {
	this.merge(this.baseParameters);
	this.setup(blueprint.sprite, blueprint);
	this.merge(override);
	this.t = 0;
}

Enemy.prototype = new Sprite();
Enemy.prototype.type = OBJECT_ENEMY;
Enemy.prototype.baseParameters = {A:0, B:0, C:0, D:0, E:0, F:0, G:0, H:0, fireOdds:0.01, interval:0.75, timer:0};

Enemy.prototype.step = function(dt) {
	this.t += dt;
	this.vx = this.A + this.B * Math.sin(this.C * this.t + this.D);
	this.vy = this.E + this.F * Math.sin(this.G * this.t + this.H);
	this.x += this.vx * dt;
	this.y += this.vy * dt;
	
	var collision = this.board.collide(this, OBJECT_PLAYER);
	if(collision) {
		collision.hit(this.damage);
		this.board.remove(this);
	}
	
	if(this.timer <= 0 && Math.random() < this.fireOdds) {
		this.timer = this.interval;
		if(this.missiles == 2) {
			this.board.add(new EnemyMissile(this.x+this.w-2, this.y+this.h/2));
			this.board.add(new EnemyMissile(this.x+2, this.y+this.h/2));
		}
		else {
			this.board.add(new EnemyMissile(this.x+this.w/2, this.y+ this.h/2));
		}
	}
	this.timer -= dt;
	
	if(this.y > Game.height || this.x < -this.w || this.x > Game.width) {
		this.board.remove(this);
	}
}

Enemy.prototype.hit = function(damage) {
	this.health -= damage;
	if(this.health<=0) {
		this.board.add(new Explosion(this.x + this.w/2, this.y + this.h/2));
		Game.points += this.points || 100;
		this.board.remove(this);
	}
};
//Enemy.prototype.draw = function(ctx) {
//	SpriteSheet.draw(ctx, enemies.basic.sprite, this.x, this.y);
//}

var EnemyMissile = function(x, y) {
	this.setup("enemy_missile", {vy:200, damage:10});
	this.x = x - this.w/2;
	this.y = y;
};

EnemyMissile.prototype = new Sprite();
EnemyMissile.prototype.type = OBJECT_ENEMY_PROJECTILE;

EnemyMissile.prototype.step = function(dt) {
	this.y += this.vy * dt;
	var collision = this.board.collide(this, OBJECT_PLAYER);
	if(collision) {
		collision.hit(this.damage);
		this.board.remove(this);
	}
	else if(this.y > Game.height)
		this.board.remove(this);
};

var Explosion = function(centerX, centerY) {
	this.setup("explosion", {frame:0});
	this.x = centerX - this.w/2;
	this.y = centerY - this.h/2;
	this.subFrame = 0;
};

Explosion.prototype = new Sprite();

Explosion.prototype.step = function(dt) {
	this.frame = Math.floor(this.subFrame++ / 3);
	if(this.subFrame > 36) {
		this.board.remove(this);
	} 
}