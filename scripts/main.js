//aliases

/*
var Application = PIXI.Application,
    autoDetectRenderer = PIXI.autoDetectRenderer,
    Container = PIXI.Container,
    Text = PIXI.Text,
    TextStyle = PIXI.TextStyle,
    Sprite = PIXI.Sprite,
    AnimatedSprite = PIXI.extras.AnimatedSprite,
    TilingSprite = PIXI.extras.TilingSprite,
    TextureCache = PIXI.utils.TextureCache,
    Texture = PIXI.Texture,
    Rectangle = PIXI.Rectangle,
    loader = PIXI.loader,
    resources = PIXI.loader.resources;
    
var renderer = autoDetectRenderer(320, 480);
renderer.view.style.position = "absolute";
renderer.view.style.display = "block";
renderer.view.style.left = ((window.innerWidth - renderer.view.width)*0.5);
renderer.view.style.top = ((window.innerHeight - renderer.view.height)*0.5);
//console.log(renderer.view.width + ", " + renderer.view.height);

document.body.appendChild(renderer.view);


var stage = new Container();
var spr = null;

window.addEventListener('load', function() {
    renderer.render(stage);
    loader.add('res/sprites.json')
            .on('progress', function(loader, resource) {
                console.log(resource.url + "... " + loader.progress);
            }).load(function() {
                var textures = resources['res/sprites.json'].textures;
                spr = new TilingSprite(textures['bg.png'], renderer.view.width, renderer.view.height);
                stage.addChild(spr);
                renderer.render(stage);
                update();
            });
    
});


function update() {
    spr.tilePosition.y++;
    if(spr.tilePosition.y > 64) spr.tilePosition.y = 0;
    renderer.render(stage);
    requestAnimationFrame(update);
}
*/

//ShipShooter main class
function ShipShooter(p, o) {
    //init the renderer
    //this.renderer = p.autoDetectRenderer(
    this.renderer = new p.CanvasRenderer(
            o.data.room.width ? o.data.room.width : 320, 
            o.data.room.height ? o.data.room.height : 480,
            o.data.room.options ? o.data.room.options : {background: '#000000'});
    this.renderer.view.style.position = "absolute";
    this.renderer.view.style.display = "block";
    this.renderer.view.style.left = (window.innerWidth - this.renderer.view.width)/2;
    this.renderer.view.style.top = (window.innerHeight - this.renderer.view.height)/2;
    
    this.stage = null;
    this.bump = new Bump(p);
    this.p = p;
    if(o.methods) {
        for(let key in o.methods) {
            this[key] = o.methods[key].bind(this);
        }
    }
    if(o.data) {
        for(let key in o.data) {
            this[key] = o.data[key];
        }
    }
    
    if(o.rooms) {
        this.rooms = {};
        for(let key in o.rooms) {
            this.rooms[key] = o.rooms[key];
        }
    }
    
    this.room.x = (window.innerWidth - this.renderer.view.width)/2;
    this.room.y = (window.innerHeight - this.renderer.view.height)/2;
    p.loader.add('res/sprites.json')
            .on('progress', function(loader, resource) {
                console.log(resource.url + "... " + loader.progress);
            }).load(function() {
                this.textures = p.loader.resources['res/sprites.json'].textures;
                //create a room for every rooms
                this.stages = {};
                for(let key in this.rooms) {
                    this.rooms[key].data.global = this;
                    this.stages[key] = new Room(this.rooms[key]);
                }
                console.log(this.stages);
                
                this.room.change = function(room, reset = true, override=null) {
                            if(override !== null) {
                                for(let k in override) {
                                    room[k] = override[k];
                                }
                            }
                            if(reset) room.reset();
                            this.stage = room;
                }.bind(this);
                
                this.stage = this.stages['menu'];
                this.update = this.update.bind(this);
                this.update();
            }.bind(this));
    document.body.appendChild(this.renderer.view);
    
    return this;
};

ShipShooter.prototype.update = function() {
    this.stage.update();
    requestAnimationFrame(this.update);
    this.renderer.render(this.stage);
};

window.addEventListener('load', function() {
    new ShipShooter(PIXI, {
        data: {
            room: {
                width: 320,
                height: 480,
                current: null
            }
        },
        rooms: {
            menu: {
                name: "Menu",
                data: {
                },
                methods: {
                },
                setup: function() {
                    
                    let rm = this.global.room;
                    let textures = this.global.textures;
                    this.add(new PIXI.Text("Ship Shooter", {
                            fontFamily: 'Century Gothic',
                            fontSize: 36,
                            fontWeight: 'bold',
                            fill: ['#ffffff', '#888888'],
                            stroke: '#444444',
                            strokeThickness: 5,
                            dropShadow: true,
                            dropShadowColor: '#222222',
                            dropShadowBlur: 4,
                            dropShadowAngle: Math.PI / 6,
                            dropShadowDistance: 6
                        }), rm.width/2, rm.height/3, 0.5);
                    this.tooltip = this.add(new PIXI.Text("", {
                            fontFamily: 'Century Gothic',
                            fontSize: 16,
                            fill: ['#ffffff', '#888888']
                    }), rm.width/2, rm.height * 0.9, 0.5); 
                    
                    let makeBigger = function(obj) {
                        obj.scale.x = 1.75;
                        obj.scale.y = 1.75;
                        this.tooltip.text = obj.tooltip;
                    }.bind(this);
                    
                    let makeDefault = function(obj) {
                        obj.scale.x = 1;
                        obj.scale.y = 1;
                        this.tooltip.text = "";
                    }.bind(this);
                    
                    let p1 = this.add(new PIXI.Sprite(textures['player1.png']),
                            rm.width/3, rm.height*0.7, 0.5);
                    p1.goto = function() {
                        this.global.room.change(this.global.stages['game'], true, {
                            shipModel: 0
                        });
                    }.bind(this);     
                    p1.tooltip = "A light ship that has focused range.";
                    p1.interactive = true;
                    p1.buttonMode = true;
                    p1.on('pointerover', function() { makeBigger(this); }.bind(p1))
                            .on('pointerdown', function() { makeBigger(this); }.bind(p1))
                            .on('pointerup', function() { makeDefault(this); this.goto(); }.bind(p1))
                            .on('pointerupoutside', function() { makeDefault(this); }.bind(p1))
                            .on('pointerout', function() { makeDefault(this); }.bind(p1));
                    
                    let p2 = this.add(new PIXI.Sprite(textures['player2.png']),
                            2*rm.width/3, rm.height*0.7, 0.5);
                    p2.goto = function() {
                        this.global.room.change(this.global.stages['game'], true, {
                            shipModel: 1
                        });
                    }.bind(this); 
                    p2.tooltip = "A heavy ship that has wide range.";
                    p2.interactive = true;
                    p2.buttonMode = true;
                    p2.on('pointerover', function() { makeBigger(this); }.bind(p2))
                            .on('pointerdown', function() { makeBigger(this); }.bind(p2))
                            .on('pointerup', function() { makeDefault(this); this.goto(); }.bind(p2))
                            .on('pointerupoutside', function() { makeDefault(this); }.bind(p2))
                            .on('pointerout', function() { makeDefault(this); }.bind(p2));
                },
                update: function() {
                    
                },
                reset: function() {
                    for(let i in this.children) {
                        this.children[i].scale.x = 1;
                        this.children[i].scale.y = 1;
                    };
                }
            },
            game: {
                name: "Game",
                data: {
                    shipModel: 0,
                    hits: 0
                },
                methods: {
                    
                },
                setup: function() {
                    let rm = this.global.room;
                    let textures = this.global.textures;
                    
                    this.bg = this.add(new Background(textures['bg.png'], rm.width, rm.height, 0, 1));
                    this.player = this.add(new Player(this.global), rm.width/2, rm.height * 0.8, 0.5, 0.5);
                     
                    this.debug = this.add(new PIXI.Text('debug', {
                        fill: ['#ffffff'],
                        fontSize: 15
                    }), rm.width/2, rm.height * 0.95, 0.5);
                    
                    this.enemies = this.add(new EnemyContainer(this.global), 0, 0);
                    this.bullets = this.add(new BulletContainer(this.global), 0, 0);
                    
                    this.charge = this.add(new PIXI.Sprite(textures['charge.png']), 0, 0, 0.5);
                    this.charge.update = function() {
                        let r = 3*this.player.width/4;
                        let c = point(this.player.x, this.player.y);
                        let ratio = 1 - (this.player.attack.current/this.player.attack.cooldown);
                        let angle = 2 * Math.PI * (ratio - 0.25);
                        this.charge.x = c.x + r * Math.cos(angle);
                        this.charge.y = c.y + r * Math.sin(angle);
                        //r2 = (x - c.x)2 + (y - c.y)2
                        
                    }.bind(this);
                    
                    this.charge.reset = function() {
                        this.charge.position.set(this.player.x, this.player.y - 3*this.player.width/4);
                        let angle = Math.atan2(this.charge.y - this.player.y, this.charge.x - this.player.x);
                    }.bind(this);
                    
                    this.interactive = true;
                    this.pointer = {
                        x: -1,
                        y: -1,
                        up: true,
                        down: false,
                        release: {
                            method: [],
                            add: function(method) {
                                this.pointer.release.method.push(method);
                            }.bind(this)                            
                        },
                        press: {
                            method: [],
                            add: function(method) {
                                this.pointer.press.method.push(method);
                            }.bind(this)
                        }
                    };
                    this.on('pointermove', function(event) {
                        let p = point(event.data.originalEvent.clientX, event.data.originalEvent.clientY);
                        this.pointer.x = clamp(p.x - this.global.room.x, 0, this.global.room.width);
                        this.pointer.y = clamp(p.y - this.global.room.y, 0, this.global.room.height);    
                    }.bind(this));
                    
                    this.on('pointerdown', function(event) {
//                        let p = point(event.data.originalEvent.clientX, event.data.originalEvent.clientY);
//                        this.pointer.x = clamp(p.x - this.global.room.x, 0, this.global.room.width);
//                        this.pointer.y = clamp(p.y - this.global.room.y, 0, this.global.room.width);
                        this.pointer.up = false;
                        this.pointer.down = true;
                        for(let key in this.pointer.press.method) {
                            this.pointer.press.method[key]();
                        }
                    }.bind(this));
                    
                    this.on('pointerup', function(event) {
//                        let p = point(event.data.originalEvent.clientX, event.data.originalEvent.clientY);
//                        this.pointer.x = clamp(p.x - this.global.room.x, 0, this.global.room.width);
//                        this.pointer.y = clamp(p.y - this.global.room.y, 0, this.global.room.width);
                        this.pointer.up = true;
                        this.pointer.down = false;
                        for(let key in this.pointer.release.method) {
                            this.pointer.release.method[key]();
                        }
                    }.bind(this));
                    
                    this.on('pointerupoutside', function(event) {
//                        let p = point(event.data.originalEvent.clientX, event.data.originalEvent.clientY);
//                        this.pointer.x = clamp(p.x - this.global.room.x, 0, this.global.room.width);
//                        this.pointer.y = clamp(p.y - this.global.room.y, 0, this.global.room.width);
                        this.pointer.up = true;
                        this.pointer.down = false;
                        for(let key in this.pointer.release.method) {
                            this.pointer.release.method[key]();
                        }
                    }.bind(this));
                    
                },
                update: function() {
                    this.bg.update();
                    this.charge.update();
                    this.player.update();
                    this.bullets.update();
                    this.enemies.update();
                },
                reset: function() {
                    this.player.change(this.shipModel);
                    this.debug.style.fill = ['#ffffff'];
                    this.bullets.clear();
                    this.charge.reset();
                    this.enemies.clear();
                    this.enemies.create.level = 0;
                    this.hits = 0;
                    this.debug.text = this.hits;
                }
            },
            score: {
                data: {
                    score: 0,
                    frames: 60,
                    ticker: 0,
                    current: 0
                },
                methods: {

                },
                setup: function() {
                    let rm = this.global.room;
                    this.add(new PIXI.Text("Total Ships Destroyed", {
                        fontFamily: 'Century Gothic',
                        fontSize: 20,
                        fill: ['#ffffff', '#888888']
                    }), rm.width/2, rm.height * 0.3, 0.5);
                    this.tooltip = this.add(new PIXI.Text("Total Ship Destroyed", {
                        fontFamily: 'Century Gothic',
                        fontSize: 40,
                        fill: ['#ffffff', '#888888']
                    }), rm.width/2, rm.height * 0.45, 0.5);
                    
                    this.play = this.add(new PIXI.Text("Play Again!", {
                        fontFamily: 'Century Gothic',
                        fontSize: 25,
                        fill: ['#ffffff', '#888888']
                    }), rm.width/2, rm.height * 0.7, 0.5);
                    this.play.interactive = true;
                    this.play.buttonMode = true;
                    
                    this.play.on('pointerup', function() {
                        this.global.room.change(this.global.stages['game']);
                    }.bind(this)).on('pointerover', function() {
                        this.play.scale.x = 1.5;
                        this.play.scale.y = 1.5;
                    }.bind(this)).on('pointerout', function() {
                        this.play.scale.x = 1;
                        this.play.scale.y = 1;
                    }.bind(this));
                    
                    this.main = this.add(new PIXI.Text("Main Menu", {
                        fontFamily: 'Century Gothic',
                        fontSize: 25,
                        fill: ['#ffffff', '#888888']
                    }), rm.width/2, rm.height * 0.85, 0.5);
                    
                    
                    this.main.on('pointerup', function() {
                        this.global.room.change(this.global.stages['menu']);
                    }.bind(this)).on('pointerover', function() {
                        this.main.scale.x = 1.5;
                        this.main.scale.y = 1.5;
                    }.bind(this)).on('pointerout', function() {
                        this.main.scale.x = 1;
                        this.main.scale.y = 1;
                    }.bind(this));
                    
                },
                update: function() {
                    if(this.frames > 0) {
                        this.frames--;
                        this.current += this.ticker;
                        this.tooltip.text = Math.floor(this.current);
                    }
                    if(this.frames <= 0) {
                        this.main.interactive = true;
                        this.main.buttonMode = true;
                        this.play.interactive = true;
                        this.play.buttonMode = true;
                        this.tooltip.text = this.score;
                    }
                },
                reset: function() {
                    this.play.scale.x = 1;
                    this.play.scale.y = 1;
                    this.main.scale.y = 1;
                    this.main.scale.y = 1;
                    this.main.interactive = false;
                    this.main.buttonMode = false;
                    this.play.interactive = false;
                    this.play.buttonMode = false;
                    this.frames = 60;
                    this.ticker = this.score/this.frames;
                    this.current = 0;
                    this.tooltip.text = this.current;
                }
            }
        }
        
    });
});