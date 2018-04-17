var Game = new function() {                                                                  
  var boards = [];

  // Game Initialization
  this.initialize = function(canvasElementId,sprite_data,callback) {
    this.canvas = document.getElementById(canvasElementId);

    this.playerOffset = 10;
    this.canvasMultiplier= 1;
    this.setupMobile();

    this.width = this.canvas.width;
    this.height= this.canvas.height;

		this.ctx = this.canvas.getContext && this.canvas.getContext("2d");
		
		if(!this.ctx) {
			return alert("Please upgrade your browser.");
		}

		
		this.setupInput();	
		this.loop();
		
		if(this.mobile){
			this.setBoard(4, new TouchControls());
		}
			
		SpriteSheet.load(sprite_data,callback);
	};

	//Handle Input
	var KEY_CODES = { 37:"left", 39:"right", 32:"fire" };
	this.keys = {};
	this.setupInput = function() {
		window.addEventListener("keydown", function(e) {
			if(KEY_CODES[event.keyCode]) {
				Game.keys[KEY_CODES[event.keyCode]] = true;
				e.preventDefault();
			}
		},
		false);
		window.addEventListener("keyup", function(e) {
			if(KEY_CODES[event.keyCode]) {
				Game.keys[KEY_CODES[event.keyCode]] = false;
				e.preventDefault();
			}
		},
		false);
	};

	//Game Loop
	this.loop = function() {
		var dt = 30/1000;
		for(var i=0, len = boards.length; i<len; i++) {
			if(boards[i]) {
				boards[i].step(dt);
//				boards[i] && boards[i].draw(Game.ctx);
				boards[i].draw(Game.ctx);
			}
		}
		setTimeout(Game.loop, 30);
	};

	this.setBoard = function(num, board) {
		boards[num] = board;
	};
	
	this.setupMobile = function() {
		var container = document.getElementById("container"),
			hasTouch = ("ontouchstart" in window),
			w = window.innerWidth, h= window.innerHeight;

		if(hasTouch) {
			this.mobile = true;
			}
		if(screen.width >= 1280 || !hasTouch) {
			return false;
			}
		if (w > h) {
			alert("Please rotate the device and then click OK.");
			w = window.innerWidth;
			h = window.innerHeight;
		}
		
		container.style.height = h*2 + "px";
		window.scrollTo(0,1);
		
		h = window.innerHeight + 2;
		container.style.height = h + "px";
		container.style.width = w + "px";
		container.style.padding = 0;
		
		if (h >= this.canvas.height * 1.75 || w >= this.canvas.height * 1.75) {
			this.canvasMultiplier = 2;
			this.canvas.width = w/2;
			this.canvas.height = h/2;
			this.canvas.style.width = w + "px";
			this.canvas.style.height = h + "px";
		}
		else {
			this.canvas.width = w;
			this.canvas.height = h;
		}
		
		this.canvas.style.position = "absolute";
		this.canvas.style.left = "0px";
		this.canvas.style.top = "0px";
	};
return this;
}

var TitleScreen = function(title, subtitle, callback) {
	var up = false;
	this.step = function(dt) {
		if(!Game.keys["fire"])
			up = true;
		if(up && Game.keys["fire"] && callback)
			callback();
	};
	
	this.draw = function(ctx) {
		ctx.fillStyle = "#FFFFFF";
		ctx.textAlign = "center";
		
		ctx.font = "bold 40px bangers";
		ctx.fillText(title, Game.width/2, Game.height/2);
		
		ctx.font = "bold 20px bangers";
		ctx.fillText(subtitle, Game.width/2, Game.height/2+40);
	};
};

var GameBoard = function() {
	var board = this;
	this.objects = [];
	this.cnt = {};
	
	this.add = function(obj) {
		obj.board = this;
		this.objects.push(obj);
		this.cnt[obj.type] = (this.cnt[obj.type] || 0) + 1;
		return obj;
	};
	
	this.remove = function(obj) {
		var idx = this.removed.indexOf(obj);
		if(idx == -1) {
			this.removed.push(obj);
			return true;
		}
		else {
			return false;
		}
	};
	
	this.resetRemoved = function() {
		this.removed = [];
	};
	
	this.finalizeRemoved = function() {
		for(var i=0, len=this.removed.length; i<len; i++) {
			var idx = this.objects.indexOf(this.removed[i]);
			if (idx != -1) {
				this.cnt[this.removed[i].type]--;
				this.objects.splice(idx,1);
			}
		}
	};

	this.iterate = function(funcName) {
		var args = Array.prototype.slice.call(arguments,1);
		for(var i=0, len=this.objects.length; i<len; i++) {
			var obj = this.objects[i];
			obj[funcName].apply(obj, args);
		}
	};
	
	this.detect = function(func) {
		for(var i=0, val=null, len=this.objects.length; i<len; i++)	
			if(func.call(this.objects[i]))
				return this.objects[i];
		return false;
	};
	
	this.step = function(dt) {
		this.resetRemoved();
		this.iterate("step", dt);	
		this.finalizeRemoved();
	};
	
	this.draw = function(ctx) {
		this.iterate("draw",ctx);
	};
	
	this.overlap = function(o1, o2) {
		return !(o1.y+o1.h<=o2.y || o1.y>=o2.y+o2.h ||
				o1.x+o1.w<=o2.x || o1.x>=o2.x+o2.w);
	};
	
	this.collide = function(obj,type) {
		return this.detect(
			function() {
				if(obj != this) {
					var col = (!type || this.type & type) && board.overlap(obj,this);
					return col ? this : false;
				}	
			}
		);
	};
};

var SpriteSheet = new function() {
	this.map = {};
	//Load method
	this.load = function(spriteData, callback) {
		this.map = spriteData;
		this.image = new Image();
		this.image.onload = callback;
		this.image.src = "images/sprites.png";
	};
	//Draw method
	this.draw = function(ctx,sprites,x,y,frame) {
		var s = this.map[sprites];
		if(!frame) frame = 0;
		ctx.drawImage( this.image,
				s.sx + frame * s.w,
				s.sy,
				s.w, s.h,
				x, y,
				s.w, s.h);
	};
}
//Class Sprite
var Sprite = function() {}

Sprite.prototype.setup = function(sprite, props) {
	this.sprite = sprite;
	this.merge(props);
	this.frame = this.frame || 0;
	this.w = SpriteSheet.map[sprite].w;
	this.h = SpriteSheet.map[sprite].h;
}

Sprite.prototype.merge = function(props) {
	if(props) {
		for (var prop in props) {
			this[prop] = props[prop];
		}
	}
}

Sprite.prototype.draw = function(ctx) {
	SpriteSheet.draw(ctx, this.sprite, this.x, this.y, this.frame);
}

Sprite.prototype.hit = function(damage) {
//	this.health -= damage;
//	if(this.health<=0) {
//		this.board.add(new Explosion(this.x + this.w/2, this.y + this.h/2));
//		this.board.remove(this);
//	}
};

var Level = function(levelData, callback) {
	this.levelData = [];
	
	for(var i=0; i<levelData.length; i++) {
		this.levelData.push(Object.create(levelData[i]));
	}
	this.t = 0;
	this.callback = callback;
};

Level.prototype.step = function(dt) {
	var idx=0, remove=[], curShip=null;
	this.t += dt * 1000;
	 // Start, End, Gap, Type, Override
	// [[ 0, 4000, 500, "step", { x: 100 } ]
	while((curShip = this.levelData[idx]) && (curShip[0] < this.t + 2000)) {
		if(this.t > curShip[1])
			remove.push(curShip);
		else if(curShip[0]< this.t) {
			var enemy = enemies[curShip[3]],
				override = curShip[4];
			this.board.add(new Enemy(enemy, override));
			curShip[0] += curShip[2];
		}
		idx++;
	}
	
	for (var i=0, len=remove.length; i<len; i++) {
		var idx = this.levelData.indexOf(remove[i]);
		if(idx != -1)
			this.levelData.splice(idx, 1);
	}

	if(this.levelData.length === 0 && this.board.cnt[OBJECT_ENEMY] === 0) {
		if(this.callback)
			this.callback();
	}
};

Level.prototype.draw = function(ctx) {};

var TouchControls = function() {
	var gutterWidth = 10;
	var unitWidth = Game.width / 5;
	var blockWidth = unitWidth - gutterWidth;
	
	this.drawSquare = function(ctx, x, y, txt, on) {
		ctx.globalAlpha = on ? 0.9 : 0.6;
		ctx.fillStyle = "#CCC";
		ctx.fillRect(x, y, blockWidth, blockWidth);
		
		ctx.fillStyle = "#FFF";
		ctx.textAlign = "center";
		ctx.globalAlpha = 1.0;
		ctx.font = "bold" + (unitWidth) + "px arial";
		ctx.fillText(txt, x+blockWidth/2, y+blockWidth/2+5);
	};
	
	this.draw = function(ctx) {
		ctx.save();
		var yLoc = Game.height - unitWidth;
		
		this.drawSquare(ctx, gutterWidth, yLoc, "\u25C0", Game.keys["left"]);
		this.drawSquare(ctx, unitWidth + gutterWidth, yLoc, "\u25B6", Game.keys["right"]);
		this.drawSquare(ctx, 4*unitWidth, yLoc, "FIRE", Game.keys["fire"]);
		
		ctx.restore();
	};
	
	this.step = function(dt) {};
	
	this.trackTouch = function(e) {
		var touch, x;
		e.preventDefault();
		Game.keys["left"] = false;
		Game.keys["right"] = false;
		for (var i=0; i<e.targetTouches.length; i++) {
			touch = e.targetTouches[i];
			x = touch.pageX / Game.canvasMultiplier - Game.canvas.offsetLeft;
			if(x < unitWidth)
				Game.keys["left"] = true;
			if(x > unitWidth && x < 2*unitWidth)
				Game.keys["right"] = true;
		}
		if(e.type == "touchstart" || e.type == "touchend") {
			for (i=0; i<e.changedTouches.length; i++) {
				touch = e.changedTouches[i];
				x = touch.pageX / Game.canvasMultiplier - Game.canvas.offsetLeft;
				if(x > 4*unitWidth)
					Game.keys["fire"] = (e.type == "touchstart");
			}
		}
	};
	
	Game.canvas.addEventListener("touchstart", this.trackTouch, true);
	Game.canvas.addEventListener("touchmove", this.trackTouch, true);
	Game.canvas.addEventListener("touchend", this.trackTouch, true);
	Game.playerOffset = unitWidth + 10;
};

var GamePoints = function() {
	Game.points = 0;
	var pointsLength = 8;
	
	this.draw = function(ctx) {
		ctx.save();
		ctx.font = "bold 18px arial";
		ctx.fillStyle = "#FFFFFF";
		
		var txt = "" + Game.points;
		
		var i = pointsLength - txt.length,
			zeros = "";
		while(i-- > 0)
			zeros += "0"; 
		
		ctx.fillText(zeros + txt, 45, 20);
		
		ctx.restore();
	};
	
	this.step = function(dt) {};
};

//Utilities
var getRandomColor = function() {
	var color = "#";
	for (var i=0; i<6; i++) {
		color += "0123456789abcdef"[Math.floor(Math.random()*16)];
	}
	return color;
};