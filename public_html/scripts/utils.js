
////////////////////////Start Background

function Background(texture, width, height, hspeed=0, vspeed=0, x=0, y=0 ) {
    
    PIXI.extras.TilingSprite.call(this, texture, width, height);
    
    this.dim = dim(x, y, texture.width, texture.height);
    
    this.speed = {
        horizontal: hspeed,
        vertical: vspeed
    };
}

Background.prototype = Object.create(PIXI.extras.TilingSprite.prototype);

Background.prototype.update = function() {
    
    this.tilePosition.x += this.speed.horizontal;
    if(this.speed.horizontal > 0) {
        if(this.tilePosition.x >= this.dim.x + this.dim.w) this.tilePosition.x = this.dim.x;
    }
    else {
        if(this.tilePosition.x <= this.dim.x - this.dim.w) this.tilePosition.x = this.dim.x;
    }
    
    this.tilePosition.y += this.speed.vertical;
    if(this.speed.vertical > 0) {
        if(this.tilePosition.y >= this.dim.y + this.dim.h) this.tilePosition.y = this.dim.y;
    }
    else {
        if(this.tilePosition.y <= this.dim.y - this.dim.h) this.tilePosition.y = this.dim.y;
    }
};

///////////////////////// End Background

///////////////////////Start Room
function Room(o) {
    PIXI.Container.call(this);
    for(let key in o.data) {
        this[key] = o.data[key];
    }
    for(let key in o.methods) {
        this[key] = o.methods[key].bind(this);
    }
    this.setup = o.setup.bind(this);
    this.reset = o.reset.bind(this);
    this.update = o.update.bind(this);
    this.setup();
    this.reset();
}

Room.prototype = Object.create(PIXI.Container.prototype);
Room.prototype.add = function(obj, x=0, y=0, ax=0, ay=null) {
    if(ay === null) ay = ax;
    if(obj.position) obj.position.set(x, y);
    if(obj.anchor) obj.anchor.set(ax, ay);
    this.addChild(obj);
    return obj;
};
///////////////// End Room

//////////////// Player

function Player(globals) {
    PIXI.Sprite.call(this);
    this.global = globals;
    this.sprites = [
        this.global.textures['player1.png'],
        this.global.textures['player2.png']
    ];
    
    this.modelNumber = 0;
    this.target = {
        x: 0,
        y: 0,
        point: function() {
            return point(this.x, this.y);
        }.bind(this.target),
        set: function(x, y) {
            this.x = x;
            this.y = y;
        }.bind(this.target)
    };
    
    let diagonal = Math.sqrt(Math.pow(this.global.room.width, 2) 
            + Math.pow(this.global.room.height, 2));
    
    this.props = [
        {
            //player1 - faster
            movespeed: diagonal * 0.0225,
            attack: {
                method: function() {
                    this.global.stage.bullets.add(this.x, this.y - this.height/2);
                }.bind(this),
                cooldown: 35,
                current: 35
            }
        },
        {
            //player2 - slower
            movespeed: diagonal * 0.01,
            attack: {
                method: function() {
                    this.global.stage.bullets.add(this.x - this.width/3, this.y);
                    this.global.stage.bullets.add(this.x + this.width/3, this.y);
                }.bind(this),
                cooldown: 60,
                current: 60
            }
        }
    ];
    
    this.update = this.update.bind(this);
    this.change = this.change.bind(this);
    
    this.scale.x = 0.75;
    this.scale.y = 0.75;
    
};

Player.prototype = Object.create(PIXI.Sprite.prototype);
Player.prototype.change = function(modelNumber) {
    this.modelNumber = modelNumber;
    this.setTexture(this.sprites[this.modelNumber]);
    for(let key in this.props[this.modelNumber]) {
        this[key] = this.props[this.modelNumber][key];
    }
    this.target.set(this.x, this.y);
};
Player.prototype.update = function() {
    this.target.x = this.global.stage.pointer.x < 0 ? this.target.x : this.global.stage.pointer.x;
    this.target.y = this.global.stage.pointer.y < 0 ? this.target.y : this.global.stage.pointer.y;
    
    //player movement
    let d = Math.sqrt(Math.pow(this.x - this.target.x, 2) + Math.pow(this.y - this.target.y, 2));
    if(this.x !== this.target.x){
        let dx = this.x + this.movespeed * (this.target.x - this.x) / d;
        this.x = clamp(isOnRange(this.target.x, this.x, dx) ? this.target.x : dx, this.width/2, this.global.room.width - this.width/2);
    }
    if(this.y !== this.target.y) {
        let dy = this.y + this.movespeed * (this.target.y - this.y) / d;
        this.y = clamp(isOnRange(this.target.y, this.y, dy) ? this.target.y : dy, this.height/2, this.global.room.height - this.height/2);
    }
    
    //spawn bullets
    
    if(this.attack.current > 0) {
        this.attack.current--;
    }
    else {
        if(this.global.stage.pointer.down) {
            this.attack.current = this.attack.cooldown;
            this.attack.method();
        }
    }
    
};

/////////////// End Player

/////////////// BulletContainer

function BulletContainer(global) {
    PIXI.Container.call(this);
    this.global = global;
    this.sprites = [];
    for(let i=0; i<10; ++i) {
        this.sprites.push(this.global.textures['pb' + i + '.png']);
    }
    this.add = this.add.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
    this.clear = this.clear.bind(this);
}

BulletContainer.prototype = Object.create(PIXI.Container.prototype);
BulletContainer.prototype.add = function(x, y) {
    let obj = new Bullet(this.global, this.sprites[random(0, this.sprites.length)]);
    obj.anchor.set(0.5, 0.5);
    obj.position.set(x, y);
    this.addChild(obj);
    return obj;
};

BulletContainer.prototype.remove = function(obj) {
    this.removeChild(obj);
};

BulletContainer.prototype.clear = function() {
    this.removeChildren(0);
};

BulletContainer.prototype.update = function() {
    for(let i in this.children) {
        this.children[i].update();
    }
};

///////////// End BulletContainer


////////////// Bullets


function Bullet(global,sprite) {
    PIXI.Sprite.call(this, sprite);
    this.global = global;
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
}

Bullet.prototype = Object.create(PIXI.Sprite.prototype);
Bullet.prototype.update = function() {
    this.y -= 8;
    if(this.y < -this.width/2) {
        this.destroy();
    }
};

Bullet.prototype.destroy = function() {
    this.global.stage.bullets.remove(this);
};

////////////// End Bullets

///////////// EnemyContainer

function EnemyContainer(global) {
    PIXI.Container.call(this);
    this.global = global;
    this.create = {
        level: 0,
        current: 60,
        cooldown: [40, 37, 33, 28, 20],
        scale: {
            min: [0.4, 0.4, 0.5, 0.5, 0.6],
            plus: [0.4, 0.4, 0.5, 0.5, 0.6]
        },
        speed: {
            min: [3, 4, 5, 6, 7],
            max: [7, 9, 13, 18, 25]
        },
        threshold: [10, 25, 50, 100]
    };
    
    this.scoreColor = [['#ffffff'], ['#00ff00'], ['#3c3cff'], ['#ffff00',] ['#ff3c000']];
    
    this.add = this.add.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
    this.clear = this.clear.bind(this);
}

EnemyContainer.prototype = Object.create(PIXI.Container.prototype);
EnemyContainer.prototype.add = function(x, y) {
    let obj = new Enemy(this.global);
    
    //sets the origin
    obj.anchor.set(0.5);
    
    //sets the starting position
    let px = random(this.global.room.width/5, 4*this.global.room.width/5);
    obj.position.set(px, -obj.height/2);
    
    //sets the scale
    obj.scale.x = this.create.scale.min[this.create.level] + Math.random() * this.create.scale.plus[this.create.level];
    obj.scale.y = obj.scale.x;
    
    //sets the speed
    let base = random(this.create.speed.min[this.create.level], this.create.speed.max[this.create.level]);
    let tx = random(obj.width/2, this.global.room.width - obj.width/2);
    let ty = this.global.room.height + obj.height/2;
    
    let angle = Math.atan2(ty - obj.y, tx - obj.x);
    obj.vx = base * Math.cos(angle);
    obj.vy = base * Math.sin(angle);
    obj.rotation = angle - Math.PI/2;
    
    this.addChild(obj);
    return obj;
};

EnemyContainer.prototype.remove = function(obj) {
    this.removeChild(obj);
};

EnemyContainer.prototype.clear = function() {
    this.removeChildren(0);
};

EnemyContainer.prototype.update = function() {
    
    if(this.create.current > 0) {
        this.create.current--;
    } else {
        this.create.current = this.create.cooldown[this.create.level];
        this.add();
    }
    
    for(let i in this.children) {
        this.children[i].update();
    }
    
    for(let i in this.children) {
        if(this.global.bump.hit(this.children[i], this.global.stage.player)) {
            this.global.room.change(this.global.stages['score'], true, {
                score: this.global.stage.hits
            });
            return;
        }
    }
    
    let bul = this.global.stage.bullets.children;
    
    for(let i in this.children) {
        for(let j in bul) {
            if(this.global.bump.hit(this.children[i], bul[j])) {
                if(this.global.stage.hits++ > this.create.threshold[this.create.level]) {
                    this.create.level = clamp(this.create.level + 1, 0, this.create.threshold.length - 1);
                    this.global.stage.debug.style.fill = this.scoreColor[this.create.level];
                }
                this.global.stage.debug.text = this.global.stage.hits;
                bul[j].destroy();
                this.children[i].destroy();
                return;
            }
        }
    }
    
};

////////////// End of EnemnyContainer

////////////// Enemy

function Enemy(global) {
    PIXI.Sprite.call(this);
    this.global = global;
    
    this.setTexture(this.global.textures['e2.png']);
    this.path = null;
    
    this.vx = 0;
    this.vy = 0;
    this.rotation = Math.PI;
    this.update = this.update.bind(this);
    this.destroy = this.destroy.bind(this);
}

Enemy.prototype = Object.create(PIXI.Sprite.prototype);
Enemy.prototype.update = function() {
    if(this.y > this.global.room.height + this.width/2) {
        this.destroy();
        return;
    }
    
    /*
    if(this.x < this.width/2) {
        this.x = this.width/2;
        this.vy *= 1.25;
    }
    
    if(this.x > this.global.room.width - this.width/2) {
        this.x = this.global.room.width - this.width/2;
        this.vx = -this.vx * 1.25;
        this.vy *= 1.25;
    }
    */
    this.x += this.vx;
    this.y += this.vy;
    
    //this.rotation += 0.01 + 0.05 * Math.random();
    
};

Enemy.prototype.destroy = function() {
    this.global.stage.enemies.remove(this);
};

/////////////// End of Enemy



function point(ix, iy) {
    return {x: ix, y: iy};
}

function dim(iw, ih) {
    return {w: iw, h: ih, width: iw, height: ih};
}

function rect(ix, iy, iw, ih) {
    let p = point(ix, iy);
    let d = dim(iw, ih);
    return {
        x: p.x, y: p.y,
        width: d.w, height: d.h,
        w: d.w, h: d.h,
        point: p, dim: d
    };
}

function rectP(r) {
    return {
        rect: r,
        a: {
            x: r.x,
            y: r.y
        },
        b: {
            x: r.x + r.w,
            y: r.y
        },
        c: {
            x: r.x + r.w,
            y: r.y + r.h
        },
        d: {
            x: r.x,
            y: r.y + r.h
        }
    }
}

function clamp(value, min, max) {
    return min === max ? min : min < max ? 
            (value < min ? min : value > max ? max : value)
            : (value > max && value < min ? 
            Math.abs(min - value) > Math.abs(max - value) 
            ? max : min : value);
}

function isOnRange(value, min, max) {
    return min === max ? value === min : 
            min < max ? value >= min && value <= max :
            value >= max && value <= min;
}

function random(min, max) {
    return Math.floor((Math.random() * (max - min)) + min);
}
