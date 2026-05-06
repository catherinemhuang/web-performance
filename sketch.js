new p5(function (p) {

  let snake;

  p.setup = function () {
    let cnv = p.createCanvas(p.windowWidth, p.windowHeight);
    cnv.parent('p5-canvas-container');

    snake = new Snake();

    // initial scene
    window.foods = [];
    generateTextPoints("We are human.");
    generateRandomFood(150);
  };

  p.draw = function () {
    p.background(10);

    // ─── STATE SWITCH ───
    if (window.gameState === "intro") {
      drawFoods();
      snake.update();
      snake.show();
      checkEating();
    }

    if (window.gameState === "Chapter1") {
      drawChapter1();
      snake.update();
      snake.show();
      checkEating();
    }

    if (window.foods.length === 0 && window.gameState === "Chapter1") {
      window.gameState = "completed";
    }

    if (window.gameState === "completed") {
      drawCompletedScreen();
      snake.update();
      snake.show();
    }
  };

  // ───────── WHO AM I SCENE ─────────
  function Chapter1() {
    if (!window.Chapter1generated) {
      window.foods = [];
      generateTextPoints("Are we alone in this universe?");
      window.Chapter1generated = true;
    }

    drawFoods();
  }

  // ───────── FOOD SYSTEM ─────────
  function generateTextPoints(txt) {
    let pg = p.createGraphics(p.width, p.height);
    pg.pixelDensity(1);
    pg.background(0);
    pg.fill(255);
    pg.textAlign(p.CENTER, p.CENTER);
    pg.textSize(120);
    pg.text(txt, p.width / 2, p.height * 0.3);
    pg.loadPixels();

    for (let x = 0; x < p.width; x += 6) {
      for (let y = 0; y < p.height; y += 6) {
        let i = (x + y * p.width) * 4;
        if (pg.pixels[i] > 50) {
          window.foods.push({
            pos: p.createVector(x, y),
            isText: true
          });
        }
      }
    }
  }

  function generateRandomFood(n) {
    for (let i = 0; i < n; i++) {
      window.foods.push({
        pos: p.createVector(p.random(p.width), p.random(p.height)),
        isText: false
      });
    }
  }

  function drawFoods() {
    p.noStroke();

    window.foods.forEach(f => {
      if (f.isText) p.fill(255);
      else p.fill(0, 255, 150);

      p.circle(f.pos.x, f.pos.y, 6);
    });
  }

  // ───────── EATING LOGIC ─────────
  function checkEating() {
    for (let i = window.foods.length - 1; i >= 0; i--) {
      let d = p.dist(
        snake.head.x,
        snake.head.y,
        window.foods[i].pos.x,
        window.foods[i].pos.y
      );

      if (d < snake.size) {
        let wasText = window.foods[i].isText;
        window.foods.splice(i, 1);

        if (!wasText && window.gameState !== "completed") {
          window.foods.push({
            pos: p.createVector(p.random(p.width), p.random(p.height)),
            isText: false
          });
        }

        snake.grow();
      }
    }
  }

  // ───────── SNAKE ─────────
  function Snake() {
    this.body = [];
    this.head = p.createVector(p.width / 2, p.height / 2);
    this.body.push(this.head.copy());

    this.len = 25;
    this.size = 10;
    this.speed = 2.5;
  }

  Snake.prototype.update = function () {
    let target = p.createVector(p.mouseX, p.mouseY);
    let dir = p5.Vector.sub(target, this.head);
    dir.setMag(this.speed);

    this.head.add(dir);

    this.body.push(this.head.copy());

    while (this.body.length > this.len) {
      this.body.shift();
    }
  };

  Snake.prototype.grow = function () {
    this.len += 4;
    this.size += 0.15;
  };

  Snake.prototype.show = function () {
    p.noStroke();

    for (let i = 0; i < this.body.length; i++) {
      let pos = this.body[i];
      let s = p.map(i, 0, this.body.length, this.size * 0.5, this.size);

      p.fill(0, 200, 255);
      p.circle(pos.x, pos.y, s);
    }
  };

  // ───────── Completed screen ─────────

  function drawCompletedScreen() {
    p.background(10);

    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text("YOU CONSUMED ALL THOUGHTS", p.width / 2, p.height / 2 - 80);

    // show NEXT button once
    if (!document.getElementById("next-btn")) {
      const btn = document.createElement("button");
      btn.id = "next-btn";
      btn.innerText = "NEXT";

      btn.style.position = "absolute";
      btn.style.left = "50%";
      btn.style.top = "60%";
      btn.style.transform = "translate(-50%, -50%)";
      btn.style.padding = "12px 24px";
      btn.style.fontSize = "16px";
      btn.style.cursor = "pointer";

      document.body.appendChild(btn);

      btn.addEventListener("click", () => {
        window.gameState = "final"; // or whatever next stage you want
        btn.remove();
      });
    }
  }
});