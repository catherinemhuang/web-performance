new p5(function(p) {

let snake;
let foods = [];

p.setup = function() {
  let cnv = p.createCanvas(p.windowWidth, p.windowHeight);
  cnv.parent('p5-canvas-container');

  snake = new Snake();
  generateTextPoints("Who are you?");
  generateRandomFood(150);
};

p.draw = function() {
  p.background(10);
  drawFoods();
  snake.update();
  snake.show();
  checkEating();
};

// ---- FOOD ----
function generateTextPoints(txt) {
  let pg = p.createGraphics(p.width, p.height);
  pg.pixelDensity(1);
  pg.background(0);
  pg.fill(255);
  pg.textAlign(p.CENTER, p.CENTER);
  pg.textSize(120);
  pg.text(txt, p.width/2, p.height * 0.3);
  pg.loadPixels();

  for (let x=0; x<p.width; x+=6) {
    for (let y=0; y<p.height; y+=6) {
      let i = (x+y*p.width)*4;
      if (pg.pixels[i] > 50) {
        foods.push({pos:p.createVector(x,y), isText:true});
      }
    }
  }
}

function generateRandomFood(n) {
  for (let i=0;i<n;i++) {
    foods.push({
      pos:p.createVector(p.random(p.width), p.random(p.height)),
      isText:false
    });
  }
}

function drawFoods() {
  p.noStroke();
  foods.forEach(f=>{
    if(f.isText) p.fill(255);
    else p.fill(0,255,150);
    p.circle(f.pos.x, f.pos.y, 6);
  });
}

function checkEating() {
  for (let i=foods.length-1;i>=0;i--) {
    let d = p.dist(snake.head.x, snake.head.y, foods[i].pos.x, foods[i].pos.y);
    if (d < snake.size) {
      let wasText = foods[i].isText;
      foods.splice(i,1);

      if (!wasText) {
        foods.push({
          pos:p.createVector(p.random(p.width), p.random(p.height)),
          isText:false
        });
      }

      snake.grow();
    }
  }
}

// ---- SNAKE ----
function Snake() {
  this.body=[];
  this.head=p.createVector(p.width/2,p.height/2);
  this.body.push(this.head.copy());
  this.len=25;
  this.size=10;
  this.speed=2.5;
}

Snake.prototype.update=function(){
  let target=p.createVector(p.mouseX,p.mouseY);
  let dir=p5.Vector.sub(target,this.head);
  dir.setMag(this.speed);
  this.head.add(dir);

  this.body.push(this.head.copy());
  while(this.body.length>this.len) this.body.shift();
};

Snake.prototype.grow=function(){
  this.len+=4;
  this.size+=0.15;
};

Snake.prototype.show=function(){
  p.noStroke();
  for(let i=0;i<this.body.length;i++){
    let pos=this.body[i];
    let s=p.map(i,0,this.body.length,this.size*0.5,this.size);
    p.fill(0,200,255);
    p.circle(pos.x,pos.y,s);
  }
};

});