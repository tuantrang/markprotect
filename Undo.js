function Undo( ){
    PIXI.Graphics.call(this);
}


Undo.prototype = Object.create(PIXI.Graphics.prototype);

Undo.prototype.addText = function(text,x,y){
    var undo = new PIXI.Text(text, {
      font: 'bold 1px Arial',
      fill: '#7da6de',
      stroke: 'black',
      strokeThickness: 3
    });
    undo.anchor.x = 0.5;
    undo.anchor.y = 0.5;
    undo.position.x = x;
    undo.position.y = y;

    this.addChild(undo);
}


