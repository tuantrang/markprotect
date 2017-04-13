var MarkProtect = function(){
    this.setupScale();

  // Setup the rendering surface.
  this.renderer = new PIXI.autoDetectRenderer(this._width, this._height, {resolution: window.devicePixelRatio || 1});
  document.body.appendChild(this.renderer.view);

  // Create the main stage to draw on.
  this.stage = new PIXI.Container();

  this.tiles = [];
  this.target = {};

  this.playerNumber = 1;
  this.players = [];

  this.MAP_ROWS = 4;
  this.MAP_COLUMNS = 4;

    // Start running mark & MarkProtect
  this.build();
}

MarkProtect.prototype = {
    /**
     * Build the scene and begin animating
     */
     build: function(){
        this.createPlayingTiles();
        this.createPlayers(2);
        this.createUndoButton();
        this.setUpCurrentPlayer();
        this.addMP();
        this.setMarkProtectLocation(this.currentPlayer.Tile);
        this.setUpMarkProtectClickEvents();

        requestAnimationFrame(this.tick.bind(this));
     },
    /**
     * Get all playing tiles
    */
    createPlayingTiles: function getAllPlayingTiles(){
        var cnt = 0;
        for (var i=0; i < this.MAP_ROWS; i++){
            for(var j=0; j < this.MAP_COLUMNS; j++){
                var tile = new Territory();
                tile.lineStyle(2,0x000000);
                tile.beginFill(0xd3d3d3);
                tile.drawRect(0,0,98,98);
                tile.name = "Tile " + cnt;
                cnt++;
                tile.x = i * 100;
                tile.y = j * 100;

                this.tiles.push(tile);
                this.stage.addChild(tile);
            }
        }
    },
    /**
     * Get current player Tile
     */
    getPlayerTile: function(playerNum){
        switch(playerNum){
            case 1:
                return this.players[0].Tile;
                break;
            case 2:
                return this.players[1].Tile;
                break;
        }
    },
    /**
     * Setup teh background in the center
     */
    createPlayers: function(numberOfPlayers){
        for (var i = 1; i <= numberOfPlayers; i++){
            var playerText = new PIXI.Text(i, {
                font: 'bold 1px Arial',
                fill: '#7da6de',
                stroke: 'black',
                strokeThickness: 3
            });
            playerText.anchor.x = 0.5;
            playerText.anchor.y = 0.5;
            playerText.position.x = 20;
            playerText.position.y = 20;

            var player = new PIXI.Graphics();
            switch(i){
                case 1:
                    player.beginFill(0x63ff00); // Green
                    player.TintColor = 0x63ff00;
                    player.x = 0;
                    player.y = 5;
                    player.Tile = this.tiles[0];
                    break;
                case 2:
                    player.beginFill(0xFFFF00); // Yellow
                    player.TintColor = 0xFFFF00;
                    player.x = 359;
                    player.y = 5;
                    player.Tile = this.tiles[12];
                    break;
                case 3:
                    break;
                case 4:
                    break;
            }
            player.drawCircle(20,20,20);
            player.endFill();
            player.name = "Player " + i;
            player.vx = 0;
            player.vy = 0;

            player.addChild(playerText);
            this.stage.addChild(player);
            this.players.push(player);
        }
    },
    /**
     * Get current player
     */
    getCurrentPlayer : function(playerNumber){
        return this.players[playerNumber -1];
    },
    /**
     * Create undo button
     */
    createUndoButton : function(){
        var undo = new PIXI.Graphics();
        undo.beginFill(0xe74c3c);
        undo.drawCircle(200,200,40);
        undo.endFill();

        var undoText = new PIXI.Text('Undo', {
            font: 'bold 1px Arial',
            fill: '#7da6de',
            stroke: 'black',
            strokeThickness: 3
        });
        undoText.anchor.x = 0.5;
        undoText.anchor.y = 0.5;
        undoText.position.x = 200;
        undoText.position.y = 200;

        undo.addChild(undoText);
        this.stage.addChild(undo);

        undo.interactive = true;
        undo.buttonMode = true;
        undo.click = function(){
            this.playerNumber++;
            if (this.playerNumber > 2) this.playerNumber = 1;
            this.currentPlayer = this.getCurrentPlayer(this.playerNumber);
            this.setUpPlayerMoveKey(this.currentPlayer);
        }.bind(this);

    },
    /**
     * Setup current player
     */
     setUpCurrentPlayer: function(){
        this.currentPlayer = this.getCurrentPlayer(this.playerNumber);
        this.colorIndex = 0;
        this.colors = ['0xfafbf3', '0xd3d3d3'];  // White, Gray

        setInterval(function(){
            this.colorIndex += 1;
            if (this.colorIndex == this.colors.length) this.colorIndex = 0;

            this.currentPlayer.tint = this.colors[this.colorIndex];
        }.bind(this),1000)

        this.setUpPlayerMoveKey();

     },
    /**
     * Switch player
     */
    switchPlayer: function (){
            this.playerNumber++;
            if (this.playerNumber > 2) this.playerNumber = 1;
            this.currentPlayer = this.getCurrentPlayer(this.playerNumber);
            this.setUpPlayerMoveKey();
            this.setMarkProtectLocation(this.currentPlayer.Tile);
     },
    /**
     * Contain the player in map
     */
    contain :  function contain(sprite, container){
        var collision = undefined;
        var left, right, top, bottom;

        // Left
        if (container.x - 100 <= 0){
            left = 0;
        }
        else {
            left = container.x - 100;
        }

        if (sprite.x <= left){
            sprite.x = left;
            collision = "left";
        }

        // Top
        if (container.y - 100 <= 0){
            top = 0;
        } else {
            top = container.y - 100;
        }

        if(sprite.y < top){
            sprite.y = top;
            collision = "top";
        }

        // Right
        if ((container.x + container.width) + 100 >= this.stage.width){
            right = this.stage.width -5;
        } else {
            right = (container.x + container.width) + 100;
        }

        if((sprite.x + sprite.width) >= right){
            sprite.x = right - sprite.width;
            collision = "right";
        }

        // Bottom
        if ((container.y + container.height) + 100 >= this.stage.height){
            bottom = this.stage.height;
        } else {
            bottom = (container.y + container.height - sprite.height)  + 100;
        }

        if(sprite.y  > bottom){
            sprite.y = bottom;
            collision = "bottom";
        }
        // Check to see if we are out of our player Tile in x direction
        this.tiles.forEach(function(tile){
            // Check if x is between this tile x ranges
            if (sprite.x >= tile.position.x && sprite.x <= tile.position.x + 100){
                if (sprite.y >= tile.position.y && sprite.y <= tile.position.y + 100){
                    this.addDropTarget(tile);
                }
            }
        }.bind(this))

        return collision;
    },

    /**
     * Setup the scale of the game
     */
    setupScale: function(){
        // Set the width and height of the scene.
        this._width = 400;//document.body.clientWidth;
        this._height = 400;//document.body.clientHeight;

        this._center = {
        x: Math.round(this._width / 2),
        y: Math.round(this._height / 2)
        };

        // Determine the scale to use for all elements
        this._scale = this._width / 400;
        if (this._scale * 400 < this._height){
            this._scale = this._height / 400;
        }
    },
    /**
     * Add mark & protect
     */
    addMP : function(){
        var mark = new PIXI.Text('X', {
        font: 'bold Arial',
        fontSize: 30,
        fill: '#7da6de',
        stroke: 'black',
        strokeThickness: 3
        });
        mark.anchor.x = 0.5;
        mark.anchor.y = 0.5;
        this.mark = mark;
        this.stage.addChild(mark);

        var protect = new PIXI.Text('P', {
        font: 'bold 1px Arial',
        fill: '#7da6de',
        stroke: 'black',
        strokeThickness: 3
        });
        protect.anchor.x = 0.5;
        protect.anchor.y = 0.5;
        this.protect = protect;
        this.stage.addChild(protect);
    },
    /**
     * Set up Mark & Protect click events
     */
    setUpMarkProtectClickEvents: function(){
        this.mark.interactive = true;
        this.protect.interactive = true;

        this.mark.click = function(){
            var markText = new PIXI.Text('X', {
                fontFamily: 'Arial',
                fontSize:80,
                fontWeight: 'bold',
                fill: this.currentPlayer.TintColor
            });
            markText.position.x = (this.currentPlayer.Tile.width - markText.width) / 2;
            markText.position.y = (this.currentPlayer.Tile.height - markText.height) /2;

            this.currentPlayer.Tile.isMarked = true;
            this.currentPlayer.Tile.markedBy = this.playerNumber;
            this.currentPlayer.Tile.markText = markText;
            this.currentPlayer.Tile.addChild(markText);

            if (this.currentPlayer.Tile.isMarked && this.currentPlayer.Tile.isProtected){
                this.currentPlayer.Tile.tint = this.currentPlayer.TintColor;
                this.currentPlayer.Tile.removeChild(this.currentPlayer.Tile.markText);
                this.currentPlayer.Tile.removeChild(this.currentPlayer.Tile.protectText);
                this.currentPlayer.Tile.markText = null;
                this.currentPlayer.Tile.protectText = null;
            }

            this.stage.removeChild(this.target);
            setTimeout(this.switchPlayer(),0);
        }.bind(this);

        this.protect.click = function(){
                var protectText = new PIXI.Text('P', {
                    fontFamily: 'Arial',
                    fontWeight: 'bold',
                    fontSize: 80,
                    fill: '#7da6de'
                });
                protectText.position.x = (this.currentPlayer.Tile.width - protectText.width) / 2;
                protectText.position.y = (this.currentPlayer.Tile.height - protectText.height) /2;

                this.currentPlayer.Tile.isProtected = true;
                this.currentPlayer.Tile.protectedBy = this.playerNumber;
                this.currentPlayer.Tile.protectText = protectText;
                this.currentPlayer.Tile.addChild(protectText);

                if (this.currentPlayer.Tile.isMarked && this.currentPlayer.Tile.isProtected){
                    this.currentPlayer.Tile.tint = this.currentPlayer.TintColor;
                    this.currentPlayer.Tile.removeChild(this.currentPlayer.Tile.markText);
                    this.currentPlayer.Tile.removeChild(this.currentPlayer.Tile.protectText);
                    this.currentPlayer.Tile.protectText = null;
                    this.currentPlayer.Tile.markText = null;
                }

                this.stage.removeChild(this.target);
                setTimeout(this.switchPlayer(),0);
            }.bind(this);
},
    /**
     * Set Mark & Protect location
     */
    setMarkProtectLocation : function(Tile){
        if (!Tile.isMarked || !Tile.isProtected){
            this.mark.visible = Tile.isMarked ? false: true;
            this.protect.visible = Tile.isProtected ? false: true;

            this.mark.position.x = Tile.x + 10;
            this.mark.position.y = (Tile.y + 100) - 20;

            this.protect.position.x = Tile.x + 90;
            this.protect.position.y = Tile.y + 80;
        } else {
            this.mark.visible = false;
            this.protect.visible = false;
        }
    },
    /**
     * Add drop target
     */
    addDropTarget: function( container){
        this.tiles.forEach(function(tile){
            tile.hasTarget = false;
        });

        this.stage.removeChild(this.target);

        if (!container.hasTarget && !container.isMarked){
            this.currentPlayer.Tile = container;

            var firstCircle = new PIXI.Graphics();
            firstCircle.lineStyle(4, 0xff0000);
            firstCircle.drawCircle(20,20,20);
            firstCircle.endFill();
            firstCircle.position.x = container.x + 30;
            firstCircle.position.y = container.y + 30;

            var secondCircle = new PIXI.Graphics();
            secondCircle.beginFill(0xff0000);
            secondCircle.drawCircle(0,0,10);
            secondCircle.position.x = 20;
            secondCircle.position.y = 20;
            secondCircle.endFill();

            firstCircle.addChild(secondCircle);
            this.stage.addChild(firstCircle);

            container.hasTarget = true;
            this.target = firstCircle;
            this.setMarkProtectLocation(container);
        }
    },
    /**
     * Move player
     */
    setUpPlayerMoveKey: function setUpPlayerMoveKey(){
        //Capture the keyboard arrow keys
        var left = this.keyboard(37),
            up = this.keyboard(38),
            right = this.keyboard(39),
            down = this.keyboard(40),
            mKey = this.keyboard(77),
            pKey = this.keyboard(80),
            enter = this.keyboard(13);

        enter.press = function(){
            this.switchPlayer();
        }.bind(this);

        //Left arrow key `press` method
        left.press = function() {
            //Change the player's velocity when the key is pressed
            this.currentPlayer.vx = -2;
            this.currentPlayer.vy = 0;
        }.bind(this);

        //Left arrow key `release` method
        left.release = function() {
            //If the left arrow has been released, and the right arrow isn't down,
            //and the player isn't moving vertically.  Stop the player
            if (!right.isDown && this.currentPlayer.vy === 0) {
                this.currentPlayer.vx = 0;
            }
        }.bind(this);

        //Up
        up.press = function() {
            this.currentPlayer.vy = -2;
            this.currentPlayer.vx = 0;
        }.bind(this);
        up.release = function() {
            if (!down.isDown && this.currentPlayer.vx === 0) {
                this.currentPlayer.vy = 0;
            }
        }.bind(this);

        //Right
        right.press = function() {
            this.currentPlayer.vx = 2;
            this.currentPlayer.vy = 0;
        }.bind(this);
        right.release = function() {
            if (!left.isDown && this.currentPlayer.vy === 0) {
                this.currentPlayer.vx = 0;
            }
        }.bind(this);

        //Down
        down.press = function() {
            this.currentPlayer.vy = 2;
            this.currentPlayer.vx = 0;
        }.bind(this);
        down.release = function() {
            if (!up.isDown && this.currentPlayer.vx === 0) {
                this.currentPlayer.vy = 0;
            }
        }.bind(this);

    },

    /**
     *  Keyboard handlers
     */
    keyboard: function keyboard(keyCode) {
        var key = {};
        key.code = keyCode;
        key.isDown = false;
        key.isUp = true;
        key.press = undefined;
        key.release = undefined;
        //The `downHandler`
        key.downHandler = function(event) {
            if (event.keyCode === key.code) {
                if (key.isUp && key.press) key.press();
                key.isDown = true;
                key.isUp = false;
            }
            event.preventDefault();
        };

        //The `upHandler`
        key.upHandler = function(event) {
            if (event.keyCode === key.code) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
            }
            event.preventDefault();
        };

        //Attach event listeners
        window.addEventListener(
            "keydown", key.downHandler.bind(key), false
        );
        window.addEventListener(
            "keyup", key.upHandler.bind(key), false
        );
        return key;
    },
    createDragAndDropFor: function (target){
        target.interactive = true;
        target.on("mousedown", function(e){
            target.data = e.data;
            target.dragging = true;
        })
        target.on("mouseup", function(e){
           delete target.data;
           target.dragging = false;
        })
        target.on("mouseupoutside", function(e){
           delete target.data;
           target.dragging = false;
        })
        target.on("mousemove", function(e){
            if(target.dragging){
                const newPosition = target.data.getLocalPosition(target.parent)
                target.x = newPosition.x;
                target.y = newPosition.y;
            }
        })
    },
    /**
     * Play function
     */
    play : function(){
        this.currentPlayer.x += this.currentPlayer.vx;
        this.currentPlayer.y += this.currentPlayer.vy;

        this.contain(this.currentPlayer, this.currentPlayer.Tile);
    },
    /**
     * Fires at the end of game loop to reset and redraw the canvas
     */
    tick : function(time){
        this.play();

        // Render the stage for the current frame
        this.renderer.render(this.stage);

        // Begin the next frame
        requestAnimationFrame(this.tick.bind(this));
    }

}
