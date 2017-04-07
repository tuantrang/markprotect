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

    // Start running mark & MarkProtect
  this.build();

}


MarkProtect.prototype = {
    /**
     * Build the scene and begin animating
     */
     build: function(){
        //Draw the background
        this.setupBg();
        this.getAllPlayingTiles();
        this.setUpCurrentPlayer();
        this.addMP();

        requestAnimationFrame(this.tick.bind(this));
     },

    /**
     * Setup teh background in the center
     */
    setupBg: function(){
        this.map = new Map(this, this.stage);
    },
    /**
     * Get all playing tiles
    */
    getAllPlayingTiles: function getAllPlayingTiles(){
        this.tiles = this.map.getAllTiles();
    },
    /**
     * Setup current player
     */
     setUpCurrentPlayer: function(){
        this.currentTile = this.map.getPlayerTile(1);
        this.currentPlayer = this.map.getCurrentPlayer(this.playerNumber);
        this.colorIndex = 0;
        this.colors = ['0xfafbf3', '0xd3d3d3'];

        setInterval(function(){
            this.colorIndex += 1;
            if (this.colorIndex == this.colors.length) this.colorIndex = 0;

            this.currentPlayer.tint = this.colors[this.colorIndex];
        }.bind(this),1000)

        this.movePlayer(this.currentPlayer);

        this.undoButton = this.map.getUndoButton();
        this.undoButton.interactive = true;
        this.undoButton.buttonMode = true;
        this.undoButton.click = function(){
            this.previousActiveTile = this.currentTile.tint = "0xd3d3d3";
            this.playerNumber++;
            if (this.playerNumber > 2) this.playerNumber = 1;
            this.currentTile = this.map.getPlayerTile(this.playerNumber);
            this.currentPlayer = this.map.getCurrentPlayer(this.playerNumber);
            this.movePlayer(this.currentPlayer);
        }.bind(this);
     },
    /**
     * Switch player
     */
    switchPlayer: function (){
            this.previousActiveTile = this.currentTile.tint = "0xd3d3d3";
            this.playerNumber++;
            if (this.playerNumber > 2) this.playerNumber = 1;
            this.currentTile = this.map.getPlayerTile(this.playerNumber);
            this.currentPlayer = this.map.getCurrentPlayer(this.playerNumber);
            this.movePlayer(this.currentPlayer);
            this.mark.position.x = this.currentTile.x + 10;
            this.mark.position.y = (this.currentTile.y + 100) - 20;
            this.protect.position.x = this.currentTile.x + 90;
            this.protect.position.y = this.currentTile.y + 80;
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
        if (container.height - 100 <= 0){
            top = 0;
        } else {
            top = container.height - 100;
        }

        if(sprite.y < container.y){
            sprite.y = container.y;
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
            bottom = (container.y + container.height) + 100;
        }

        if(sprite.y + sprite.height > bottom){
            sprite.y = bottom - sprite.height;
            collision = "bottom";
        }
        // Check to see if we are out of our player Tile in x direction
        if (sprite.x > (container.x + 100)){
            this.tiles.forEach(function(tile){
                // Check if x is between this tile x ranges
                if (sprite.x >= tile.position.x && sprite.x <= tile.position.x + 100){
                    if (sprite.y >= tile.position.y && sprite.y <= tile.position.y + 100){
                        this.addDropTarget(this.stage, tile);
                    }
                }
            }.bind(this))
        }

        // Check to see if we are out of our player Tile in y direction
        if (sprite.y > (container.y + 100)){
            this.tiles.forEach(function(tile){
                // Check if x is between this tile x ranges
                if (sprite.x >= tile.position.x && sprite.x <= tile.position.x + 100){
                    if (sprite.y >= tile.position.y && sprite.y <= tile.position.y + 100){
                        this.addDropTarget(this.stage, tile);
                    }
                }
            }.bind(this))
        }

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
        font: 'bold 1px Arial',
        fill: '#7da6de',
        stroke: 'black',
        strokeThickness: 3
        });
        mark.anchor.x = 0.5;
        mark.anchor.y = 0.5;
        mark.position.x = this.currentTile.x + 10;
        mark.position.y = (this.currentTile.y + 100) - 20;
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
        protect.position.x = this.currentTile.x + 90;
        protect.position.y = this.currentTile.y + 80;
        this.protect = protect;
        this.stage.addChild(protect);
    },
    /**
     * Add drop target
     */
    addDropTarget: function(stage, container){
        if (stage.children.indexOf(this.target) < 0  && !container.isMarked){
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
            container.isMarked = true;
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
            down = this.keyboard(40);

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
            this.currentTile.isMarked = true;
            this.currentTile.markedBy = this.playerNumber;
            var markText = new PIXI.Text('X', {
                font: 'bold 40px Arial',
                fill: '#7da6de'
            });
            markText.position.x = 50 - markText.width;
            markText.position.y = 50 - markText.height;
            this.moveOverTile.addChild(markText);

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
