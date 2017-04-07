function Map(main, stage){
    this.tiles = [];
    this.players = [];
    this.undoButton = {};

    this.createGameTile(main, stage);
}

Map.prototype.createGameTile = function(main, stage){
    var cnt = 0;
    for (var i=0; i < Map.ROW; i++){
        for(var j=0; j < Map.COLUMN; j++){
            var tile = new Territory( 0, 0);
            tile.lineStyle(2,0x000000);
            tile.beginFill(0xd3d3d3);
            tile.drawRect(0,0,98,98);
            tile.name = "Tile " + cnt;
            cnt++;
            tile.x = i * 100;
            tile.y = j * 100;

            this.tiles.push(tile);
            stage.addChild(tile);
        }
    }

    var player1 = new Undo();
    player1.beginFill(0x63ff00);
    player1.drawCircle(20,20,20);
    player1.endFill();
    player1.addText('1',20,20);
    player1.name = "Player 1";
    player1.vx = 0;
    player1.vy = 0;
    player1.x = 0;
    player1.y = 5;
    stage.addChild(player1);
    this.players.push(player1);

    var player2 = new Undo();
    player2.beginFill(0xdef424);
    player2.drawCircle(20,20,20);
    player2.endFill();
    player2.addText('2',20,20);
    player2.name = "Player 2";
    player2.vx = 0;
    player2.vy = 0;
    player2.x = 359;
    player2.y = 5;
    stage.addChild(player2);
    this.players.push(player2);

    var undo = new Undo();
    undo.beginFill(0xe74c3c);
    undo.drawCircle(200,200,40);
    undo.endFill();
    undo.addText('Undo',200, 200);
    this.undoButton = undo;

    stage.addChild(undo);
}

Map.prototype.getPlayerTile = function(playerNum){
    switch(playerNum){
        case 1:
            return this.tiles[0];
            break;
        case 2:
            return this.tiles[12];
            break;
    }
}

Map.prototype.getCurrentPlayer = function(playerNum){
    switch(playerNum){
        case 1:
            return this.players[0];
            break;
        case 2:
            return this.players[1];
            break;
    }
}

Map.prototype.getAllTiles = function(){
    return this.tiles;
}

Map.prototype.getUndoButton = function(){
    return this.undoButton;
}

Map.ROW = 4;
Map.COLUMN = 4;