var test = function(){
    this._width = 1920;
    this._height = 1080;

    var Container = PIXI.Container,
        autoDetectRenderer = PIXI.autoDetectRenderer,
        loader = PIXI.loader,
        resources = PIXI.loader.resources,
        Graphics = PIXI.Graphics,
        Text = PIXI.Text,
        Sprite = PIXI.Sprite;

    var stage = new Container(), renderer = autoDetectRenderer(this._width, this._height);
    document.body.appendChild(renderer.view);

    var id, dungeon, door, explorer, treasure, blobs,
        healthBar, innerBar, outerBar, message, explorerHit,
        gameScene, gameOverScene, state, drag;

    loader
        .add('images/treasureHunter.json')
        .load(setup);

    function setup(){
        gameScene = new Container();
        stage.addChild(gameScene);

        gameOverScene = new Container();
        stage.addChild(gameOverScene);

        //Make the `gameOver` scene invisible when the game first starts
        gameOverScene.visible = false;

        id = resources["images/treasureHunter.json"].textures;


        // Dungeon
        dungeon = new Sprite(id["dungeon.png"]);
        gameScene.addChild(dungeon);

        // Door
        door = new Sprite(id["door.png"]);
        door.position.set(32,0);
        gameScene.addChild(door);

        // Explorer
        explorer = new Sprite(id["explorer.png"]);
        explorer.x = 68;
        explorer.y = gameScene.height / 2 - explorer.height / 2;
        explorer.vx = 0;
        explorer.vy = 0;
        gameScene.addChild(explorer);

        // Treasure
        treasure = new Sprite(id["treasure.png"]);
        treasure.x = gameScene.width - treasure.width - 48;
        treasure.y = gameScene.height / 2 - treasure.height / 2;
        gameScene.addChild(treasure);

        // Move the blob monsters
        createBlobs();

        createHealthBar();

        createGameEndText();

        moveExplorer();

        createDragAndDropFor(treasure);

        state = play;

        gameLoop();


    };

    function gameLoop(){
        requestAnimationFrame(gameLoop);

        state();

        renderer.render(stage);
    }

    function moveExplorer(){
        //Capture the keyboard arrow keys
        var left = keyboard(37),
            up = keyboard(38),
            right = keyboard(39),
            down = keyboard(40);

        //Left arrow key `press` method
        left.press = function() {

            //Change the explorer's velocity when the key is pressed
            explorer.vx = -5;
            explorer.vy = 0;
        };

        //Left arrow key `release` method
        left.release = function() {

            //If the left arrow has been released, and the right arrow isn't down,
            //and the explorer isn't moving vertically:
            //Stop the explorer
            if (!right.isDown && explorer.vy === 0) {
            explorer.vx = 0;
            }
        };

        //Up
        up.press = function() {
            explorer.vy = -5;
            explorer.vx = 0;
        };
        up.release = function() {
            if (!down.isDown && explorer.vx === 0) {
            explorer.vy = 0;
            }
        };

        //Right
        right.press = function() {
            explorer.vx = 5;
            explorer.vy = 0;
        };
        right.release = function() {
            if (!left.isDown && explorer.vy === 0) {
            explorer.vx = 0;
            }
        };

        //Down
        down.press = function() {
            explorer.vy = 5;
            explorer.vx = 0;
        };
        down.release = function() {
            if (!up.isDown && explorer.vx === 0) {
            explorer.vy = 0;
            }
        };

    }

    function contain(sprite, container){
        var collision = undefined;

        // Left
        if (sprite.x < container.x){
            sprite.x = container.x;
            collision = "left";
        }

        // Top
        if(sprite.y < container.y){
            sprite.y = container.y;
            collision = "top";
        }

        // Right
        if(sprite.x + sprite.width > container.width){
            sprite.x = container.width - sprite.width;
            collision = "right";
        }

        // Bottom
        if(sprite.y + sprite.height > container.height){
            sprite.y = container.height - sprite.height;
            collision = "bottom";
        }

        // Return the 'collision' value
        return collision;

    }

    function play(){
        // Move the explorer and contain it inside the dungeon
        explorer.x += explorer.vx;
        explorer.y += explorer.vy;

        contain(explorer, {x: 28, y: 10, width: 488, height: 488});

        explorerHit = false;

        moveBlob();

        if (explorerHit){
            // Make the explorer semi-transparent
            explorer.alpha = 0.5;

            healthBar.outer.width -= 1;
        } else {
            // Make explorer full opague (non-transparent) if it hasn't been hit
            explorer.alpha = 1;
        }

        //Check for a collision between the explorer and the treasure
        if (hitTestRectangle(explorer, treasure)) {

            //If the treasure is touching the explorer, center it over the explorer
            treasure.x = explorer.x + 8;
            treasure.y = explorer.y + 8;
        }

        //Does the explorer have enough health? If the width of the `innerBar`
        //is less than zero, end the game and display "You lost!"
        if (healthBar.outer.width < 0) {
            state = end;
            message.text = "You lost!";
        }

        //If the explorer has brought the treasure to the exit,
        //end the game and display "You won!"
        if (hitTestRectangle(treasure, door)) {
            state = end;
            message.text = "You won!";
        }
    }

    function moveBlob(){
        blobs.forEach(function(blob){
            // Move the blob
            blob.y += blob.vy;

            // Check the blob's screen boundaries
            var blobHitsWall = contain(blob, {x:28, y: 10, width: 488, height: 480});

            // If the blob hits the top or bottom of the stage, reverse
            // its direction
            if(blobHitsWall === "top" || blobHitsWall === "bottom"){
                blob.vy *= -1;
            }

            // Test for a collision.  If any of the enemies are touching
            //the explorer, set 'explorerHit' to 'true'
            if (hitTestRectangle(explorer, blob)){
                explorerHit = true;
            }
        });
    }

    function createBlobs(){
        var numberOfBlobs  = 6,
            spacing = 48,
            xOffset = 150,
            speed = 2,
            direction = 1;

        blobs = [];

        for (var i = 0; i < numberOfBlobs; i++) {
            // Make a blobs
            var blob = new Sprite(id["blob.png"]);

            // Space each blob horizontally according to the 'spacing' value.
            // 'xOffset' determines the point from the left of the screen
            // at which the first blbo should be added
            var x = spacing * i + xOffset;

            //  Give the blob a random 'y' position
            var y = randomInt(0, stage.height - blob.height);
            // Set the blob's position
            blob.x = x;
            blob.y = y;


            // Set the blob's vertical velocity. 'direction' will be either '1' or
            //'-1'. '1' mean the enemy will move down and '-1' means the blob will
            // move up.  Multiplying 'direction' by 'speed' determines the blob's vertical direction
            blob.vy = speed * direction;

            // Reverse the direction for the next blob
            direction *= -1;

            // Push the blob into the 'blobs' array
            blobs.push(blob);

            // Add the blob to the 'gameScene'
            gameScene.addChild(blob);
        }
    }

    function createHealthBar(){
        healthBar = new Container();
        healthBar.position.set(stage.width - 170, 6);
        gameScene.addChild(healthBar);

        // Create the black background bar
        var innerBar = new Graphics();
        innerBar.beginFill(0x000000);
        innerBar.drawRect(0,0, 128,8);
        innerBar.endFill();
        healthBar.addChild(innerBar);

        // Create the front green bar
        outerBar = new Graphics();
        outerBar.beginFill(0x00ff00);
        outerBar.drawRect(0,0,128,8);
        outerBar.endFill();
        healthBar.addChild(outerBar);

        healthBar.outer = outerBar;
    }

    function createGameEndText(){
        message = new Text(
            "The End!",
            {font: '64px Futura', fill: 'white'}
        );

        message.x = 120;
        message.y = stage.height / 2 - 32;

        gameOverScene.addChild(message);
    }

    function createDragAndDropFor(target){
        target.interactive = true;
        target.on("mousedown", function(e){
            drag = target;
        })
        target.on("mouseup", function(e){
            drag = false;
        })
        target.on("mousemove", function(e){
            if(drag){
            drag.position.x += e.data.originalEvent.movementX;
            drag.position.y += e.data.originalEvent.movementY;
            }
        })
    }

    function end(){
        gameScene.visible = false;
        gameOverScene.visible = true;
    }

    function hitTestRectangle(r1, r2){
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
    }

    function keyboard(keyCode) {
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
    }

    //The `randomInt` helper function
    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

}

var myFunc = new test();