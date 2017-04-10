var MarkProtect = function(){
    this.setupScale();

  // Setup the rendering surface.
  this.renderer = new PIXI.autoDetectRenderer(this._width, this._height, {resolution: window.devicePixelRatio || 1});
  document.body.appendChild(this.renderer.view);

  // Create the main stage to draw on.
  this.stage = new PIXI.Container();
  this.previousActiveTile = {};
  this.moveOverTile = {};

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
        //this.addMP();
      //  this.setMarkProtectLocation();

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
                    player.beginFill(0x63ff00);
                    player.TintColor = 0x63ff00;
                    player.x = 0;
                    player.y = 5;
                    player.Tile = this.tiles[0];
                    break;
                case 2:
                    player.beginFill(0xdef424);
                    player.TintColor = 0xdef424;
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

        this.undoButton = undo;
        this.undoButton.interactive = true;
        this.undoButton.buttonMode = true;
        this.undoButton.click = function(){
            this.previousActiveTile = this.currentTile.tint = "0xd3d3d3";
            this.playerNumber++;
            if (this.playerNumber > 2) this.playerNumber = 1;
            this.currentTile = this.getPlayerTile(this.playerNumber);
            this.currentPlayer = this.getCurrentPlayer(this.playerNumber);
            this.movePlayer(this.currentPlayer);
        }.bind(this);

    },
    /**
     * Setup current player
     */
     setUpCurrentPlayer: function(){
        this.currentTile = this.getPlayerTile(this.playerNumber);
        this.moveOverTile = this.currentTile;
        this.currentPlayer = this.getCurrentPlayer(this.playerNumber);
        this.colorIndex = 0;
        this.colors = ['0xfafbf3', '0xd3d3d3'];

        setInterval(function(){
            this.colorIndex += 1;
            if (this.colorIndex == this.colors.length) this.colorIndex = 0;

            this.currentPlayer.tint = this.colors[this.colorIndex];
        }.bind(this),1000)

        this.movePlayer(this.currentPlayer);

     },
    /**
     * Switch player
     */
    switchPlayer: function (){
            //this.previousActiveTile = this.currentTile.tint = "0xd3d3d3";
            this.playerNumber++;
            if (this.playerNumber > 2) this.playerNumber = 1;
            this.currentTile = this.getPlayerTile(this.playerNumber);
            this.moveOverTile = this.currentTile;
            this.currentPlayer = this.getCurrentPlayer(this.playerNumber);
            this.movePlayer(this.currentPlayer);
           // this.setMarkProtectLocation();
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
     * Contain the player in map
     */
    contain :  function contain(sprite, container, stage){
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
        if ((container.x + container.width) + 100 >= stage.width){
            right = stage.width -5;
        } else {
            right = (container.x + container.width) + 100;
        }

        if((sprite.x + sprite.width) >= right){
            sprite.x = right - sprite.width;
            collision = "right";
        }

        // Bottom
        if ((container.y + container.height) + 100 >= stage.height){
            bottom = stage.height;
        } else {
            bottom = (container.y + container.height - sprite.height)  + 100;
        }

        if(sprite.y  > bottom){
            sprite.y = bottom;
            collision = "bottom";
        }
        // Check to see if we are out of our player Tile in x direction
        //if (sprite.x > container.x  || sprite.x < (container.x + 100)){
            this.tiles.forEach(function(tile){
                // Check if x is between this tile x ranges
                if (sprite.x >= tile.position.x && sprite.x <= tile.position.x + 100){
                    if (sprite.y >= tile.position.y && sprite.y <= tile.position.y + 100){
                        this.addDropTarget(this.stage, tile, container);
                    }
                }
            }.bind(this))
        //}

        // Check to see if we are out of our player Tile in y direction
        //if (sprite.y > container.y || sprite.y < (container.y + 100)){
            // this.tiles.forEach(function(tile){
            //     // Check if x is between this tile x ranges
            //     if (sprite.x >= tile.position.x && sprite.x <= tile.position.x + 100){
            //         if (sprite.y >= tile.position.y && sprite.y <= tile.position.y + 100){
            //             this.addDropTarget(this.stage, tile, container);
            //         }
            //     }
            // }.bind(this))
        //}

        // Return the 'collision' value
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
        font: 'bold 30px Arial',
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
     * Set Mark & Protect location
     */
    setMarkProtectLocation : function(){
        this.mark.position.x = this.currentPlayer.Tile.x + 10;
        this.mark.position.y = (this.currentPlayer.Tile.y + 100) - 20;
        this.protect.position.x = this.currentPlayer.Tile.x + 90;
        this.protect.position.y = this.currentPlayer.Tile.y + 80;
    },
    /**
     * Add drop target
     */
    addDropTarget: function(stage, container, currentContainer){
        this.tiles.forEach(function(tile){
            tile.hasTarget = false;
        });

        this.stage.removeChild(this.target);

        if (!container.hasTarget && !container.isMarked){
            this.moveOverTile = container;
            this.target = null;
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
            stage.addChild(firstCircle);
            container.hasTarget = true;
            this.target = firstCircle;
        }
    },
    /**
     * Move player
     */
    movePlayer: function movePlayer(player){
        //Capture the keyboard arrow keys
        var left = this.keyboard(37),
            up = this.keyboard(38),
            right = this.keyboard(39),
            down = this.keyboard(40),
            mKey = this.keyboard(77),
            pKey = this.keyboard(80),
            enter = this.keyboard(13)
            ;

        //M arrow key `press` method
        mKey.press = function() {
            this.moveOverTile.isMarked = true;
            this.moveOverTile.markedBy = this.playerNumber;
            var markText = new PIXI.Text('X', {
                font: 'bold 40px Arial',
                fill: '#7da6de'
            });
            markText.position.x = 50 - markText.width;
            markText.position.y = 50 - markText.height;
            this.moveOverTile.addChild(markText);
            this.currentPlayer.Tile = this.moveOverTile;
            this.currentPlayer.tint = this.currentPlayer.TintColor;

            this.stage.removeChild(this.target);
            this.switchPlayer();
        }.bind(this);

        //M key `release` method
        mKey.release = function() {

            //If the left arrow has been released, and the right arrow isn't down,
            //and the explorer isn't moving vertically:
            //Stop the explorer
            if (!right.isDown && player.vy === 0) {
            player.vx = 0;
            }
        };

        //Left arrow key `press` method
        left.press = function() {

            //Change the explorer's velocity when the key is pressed
            player.vx = -5;
            player.vy = 0;
        };

        //Left arrow key `release` method
        left.release = function() {

            //If the left arrow has been released, and the right arrow isn't down,
            //and the explorer isn't moving vertically:
            //Stop the explorer
            if (!right.isDown && player.vy === 0) {
            player.vx = 0;
            }
        };

        //Up
        up.press = function() {
            player.vy = -5;
            player.vx = 0;
        };
        up.release = function() {
            if (!down.isDown && player.vx === 0) {
            player.vy = 0;
            }
        };

        //Right
        right.press = function() {
            player.vx = 5;
            player.vy = 0;
        };
        right.release = function() {
            if (!left.isDown && player.vy === 0) {
            player.vx = 0;
            }
        };

        //Down
        down.press = function() {
            player.vy = 5;
            player.vx = 0;
        };
        down.release = function() {
            if (!up.isDown && player.vx === 0) {
            player.vy = 0;
            }
        };

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
    /**
     * Play function
     */
    play : function(){
        this.currentPlayer.x += this.currentPlayer.vx;
        this.currentPlayer.y += this.currentPlayer.vy;

        //Check for a collision between the explorer and the treasure
        if (this.hitTestRectangle(this.currentPlayer, this.mark)) {
            //If the treasure is touching the explorer, center it over the explorer
            this.mark.x = this.currentPlayer.x - 8;
            this.mark.y = this.currentPlayer.y + 8;
        }

        //Check for a collision between the explorer and the treasure
        if (this.hitTestRectangle(this.mark, this.target)) {
            //If mark touches the target then set the mark next to the target;
            this.mark.x = this.target.x + this.target.width + 8;
            this.moveOverTile.isMarked = true;
            this.moveOverTile.markedBy = this.playerNumber;
            var markText = new PIXI.Text('X', {
                font: 'bold 40px Arial',
                fill: '#7da6de'
            });
            markText.position.x = 50 - markText.width;
            markText.position.y = 50 - markText.height;
            this.moveOverTile.addChild(markText);
            this.currentPlayer.Tile = this.moveOverTile;
            this.currentPlayer.tint = this.currentPlayer.TintColor;

            this.stage.removeChild(this.target);
            this.switchPlayer();
        }

        this.contain(this.currentPlayer, this.currentTile, this.stage);
    },
    /**
     * Hit test
     */
    hitTestRectangle: function hitTestRectangle(r1, r2){
        // Define the variables we'll need to calculate
        var hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

        // hit will determine whether there's a collision
        hit = false;

        // Find the center points of each Sprite
        r1.centerX = r1.x + r1.width / 2;
        r1.centerY = r1.y + r1.height / 2;
        r2.centerX = r2.x + r2.width /2;
        r2.centerY = r2.y + r2.height / 2;

        // Find the half-widths and half-heights of each Sprite
        r1.halfWidth = r1.width / 2;
        r1.halfHeight = r1.height / 2;
        r2.halfWidth = r2.width / 2;
        r2.halfHeight = r2.height / 2;

        // calculate the distance vector between the sprites
        vx = r1.centerX - r2.centerX;
        vy = r1.centerY - r2.centerY;

        // Figure out the combined half-widths and half-heights
        combinedHalfWidths = r1.halfWidth + r2.halfWidth;
        combinedHalfHeights = r1.halfHeight + r2.halfHeight;

        // Check for a collision on the x axis
        if (Math.abs(vx) < combinedHalfWidths){
            if (Math.abs(vy) < combinedHalfHeights){
                // There's definitely a collision happening
                hit = true;
            } else {
                // There's no collision on the y axis
                hit = false;
            }
        } else {
            // There's no collision on the x-axis
            hit = false;
        }

        return hit;
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
