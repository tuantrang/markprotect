function Territory( stage, x,y){
    PIXI.Graphics.call(this);
    this.mark = {};
}


Territory.prototype = Object.create(PIXI.Graphics.prototype);

Territory.prototype.getMark = function(){
    return this.mark;
}

Territory.WIDTH = 100;
Territory.HEIGHT = 100;
