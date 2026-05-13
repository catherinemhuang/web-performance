let handshake = document.querySelector("#handshake");

handshake.addEventListener("click", async () => {
	await Tone.start();
	handshake.style.display = "none";
});

new p5(function (p) {

  let snake;
  let lastNoteTime = 0;
  var notes = ['C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','G5','A5'];

  // ─── HEALTH / DECAY SYSTEM ───────────────────────────
  var snakeHealth = 100;
  var lastEatTime = 0;
  var HEALTH_DRAIN_PER_MS = 0.02; // drains fully in ~20s; requires ~5 dots/sec
  var HEALTH_PER_EAT = 3;
  var MIN_SNAKE_SIZE = 3;
  var failureShown = false;
  var ufos = [];
  var failureReason = "starved"; // "starved" or "caught"

  // Create synth immediately — it exists before any user interaction
  var synth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.05, release: 0.4 },
    volume: -12
  }).toDestination();

  // Unlock the audio context on first gesture (required by browsers)
  var audioUnlocked = false;
  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    Tone.start();
  }

  document.addEventListener('mousedown', unlockAudio);
  document.addEventListener('click', unlockAudio);

  p.setup = function () {
    let cnv = p.createCanvas(p.windowWidth, p.windowHeight);
    cnv.parent('p5-canvas-container');

    snake = new Snake();

    window.foods = [];
    window.Chapter1generated = false;
    window.Chapter2generated = false;
    window.Chapter3generated = false;

    snakeHealth = 100;
    lastEatTime = performance.now();
    failureShown = false;
    ufos = [];

    generateTextPoints("We are human.");
    generateRandomFood(150);
  };

  p.mousePressed = function () {
    unlockAudio();
  };

  p.draw = function () {
    p.background(10);

    var isChapterActive = (window.gameState === "Chapter1" ||
                           window.gameState === "Chapter2" ||
                           window.gameState === "Chapter3");

    if (isChapterActive && !failureShown) {
      var now = performance.now();
      var elapsed = now - lastEatTime;
      snakeHealth = Math.max(0, snakeHealth - elapsed * HEALTH_DRAIN_PER_MS);
      lastEatTime = now;

      if (snakeHealth < 30) {
        snake.size = Math.max(MIN_SNAKE_SIZE, snake.size - 0.04);
      }

      if (snakeHealth <= 0 || snake.size <= MIN_SNAKE_SIZE) {
        triggerFailure("starved");
      }
    }

    if (window.gameState === "intro") {
      drawFoods();
      snake.update();
      snake.show();
      checkEating();
    }

    if (window.gameState === "Chapter1") {
      Chapter1();
      snake.update();
      snake.show();
      checkEating();
      updateUFOs();

      if (window.Chapter1generated && textFoodsLeft() === 0) {
        window.gameState = "Chapter1complete";
        window.foods = [];
        showChapterEndUI(
          "Perhaps not.",
          "NEXT CHAPTER \u2192",
          function() {
            window.gameState = "Chapter2";
            window.Chapter2generated = false;
            window.foods = [];
            resetSnake();
            removeChapterEndUI();
          }
        );
      }
    }

    if (window.gameState === "Chapter2") {
      Chapter2();
      snake.update();
      snake.show();
      checkEating();
      updateUFOs();

      if (window.Chapter2generated && textFoodsLeft() === 0) {
        window.gameState = "Chapter2complete";
        window.foods = [];
        showChapterEndUI(
          "Perhaps a signal should be sent out.",
          "NEXT CHAPTER \u2192",
          function() {
            window.gameState = "Chapter3";
            window.Chapter3generated = false;
            window.foods = [];
            resetSnake();
            removeChapterEndUI();
          }
        );
      }
    }

    if (window.gameState === "Chapter3") {
      Chapter3();
      snake.update();
      snake.show();
      checkEating();
      updateUFOs();

      if (window.Chapter3generated && textFoodsLeft() === 0) {
        window.gameState = "Chapter3complete";
        window.foods = [];
        showDecisionUI();
      }
    }

    if (window.gameState === "Chapter1complete" ||
        window.gameState === "Chapter2complete" ||
        window.gameState === "Chapter3complete" ||
        window.gameState === "endingYes" ||
        window.gameState === "endingNo") {
      snake.update();
      snake.show();
    }

    if (isChapterActive && !failureShown) {
      drawHealthBar();
    }
  };

  function Chapter1() {
    if (!window.Chapter1generated) {
      window.foods = [];
      generateTextPoints("Are we alone in this universe?");
      generateRandomFood(80);
      window.Chapter1generated = true;
      snakeHealth = 100;
      lastEatTime = performance.now();
      failureShown = false;
      spawnUFOs(1);
    }
    drawFoods();
  }

  function Chapter2() {
    if (!window.Chapter2generated) {
      window.foods = [];
      generateTextPoints("What could be out there?");
      generateRandomFood(80);
      window.Chapter2generated = true;
      snakeHealth = 100;
      lastEatTime = performance.now();
      failureShown = false;
      spawnUFOs(2);
    }
    drawFoods();
  }

  function Chapter3() {
    if (!window.Chapter3generated) {
      window.foods = [];
      generateTextPoints("Are they like us?");
      generateRandomFood(80);
      window.Chapter3generated = true;
      snakeHealth = 100;
      lastEatTime = performance.now();
      failureShown = false;
      spawnUFOs(3);
    }
    drawFoods();
  }

  function generateTextPoints(txt) {
    // Use a native canvas instead of p5.createGraphics — much faster, no p5 overhead
    var offscreen = document.createElement('canvas');
    offscreen.width = p.width;
    offscreen.height = p.height;
    var ctx = offscreen.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, p.width, p.height);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 80px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, p.width / 2, p.height * 0.3);

    var imageData = ctx.getImageData(0, 0, p.width, p.height);
    var pixels = imageData.data;
    var step = 8; // slightly coarser grid = fewer dots = less work per frame

    for (var x = 0; x < p.width; x += step) {
      for (var y = 0; y < p.height; y += step) {
        var i = (x + y * p.width) * 4;
        if (pixels[i] > 50) {
          window.foods.push({ pos: p.createVector(x, y), isText: true });
        }
      }
    }
  }

  function generateRandomFood(n) {
    for (var i = 0; i < n; i++) {
      window.foods.push({
        pos: p.createVector(p.random(p.width), p.random(p.height)),
        isText: false
      });
    }
  }

  function drawFoods() {
    p.noStroke();
    window.foods.forEach(function(f) {
      if (f.isText) p.fill(255);
      else p.fill(0, 255, 150);
      p.circle(f.pos.x, f.pos.y, 6);
    });
  }

  function textFoodsLeft() {
    var count = 0;
    for (var i = 0; i < window.foods.length; i++) {
      if (window.foods[i].isText) count++;
    }
    return count;
  }

  function checkEating() {
    var eaten = 0;
    var maxPerFrame = 3; // cap: never eat more than 3 dots in one draw tick
    for (var i = window.foods.length - 1; i >= 0 && eaten < maxPerFrame; i--) {
      var d = p.dist(snake.head.x, snake.head.y, window.foods[i].pos.x, window.foods[i].pos.y);
      if (d < snake.size) {
        var wasText = window.foods[i].isText;
        window.foods.splice(i, 1);
        eaten++;

        if (!wasText &&
            window.gameState !== "Chapter1complete" &&
            window.gameState !== "Chapter2complete" &&
            window.gameState !== "Chapter3complete") {
          window.foods.push({
            pos: p.createVector(p.random(p.width), p.random(p.height)),
            isText: false
          });
        }

        snake.grow();

        // ─── HEALTH RESTORE ON EAT ───────────────────────
        snakeHealth = Math.min(100, snakeHealth + HEALTH_PER_EAT);
        lastEatTime = performance.now();

        // throttle notes: max one every 80ms so rapid eating never stacks audio calls
        var now = performance.now();
        if (now - lastNoteTime > 80) {
          lastNoteTime = now;
          var note = notes[Math.floor(Math.random() * notes.length)];
          synth.triggerAttackRelease(note, "16n");
        }
      }
    }
  }

  function resetSnake() {
    snake.body = [];
    snake.head = p.createVector(p.width / 2, p.height / 2);
    snake.body.push(snake.head.copy());
    snake.len = 25;
    snake.size = 10;
    snake.speed = 2.5;
    snakeHealth = 100;
    lastEatTime = performance.now();
    failureShown = false;
    ufos = [];
  }

  window.resetSnake = resetSnake;

  function Snake() {
    this.body = [];
    this.head = p.createVector(p.width / 2, p.height / 2);
    this.body.push(this.head.copy());
    this.len = 25;
    this.size = 10;
    this.speed = 2.5;
  }

  Snake.prototype.update = function () {
    var target = p.createVector(p.mouseX, p.mouseY);
    var dir = p5.Vector.sub(target, this.head);
    dir.setMag(this.speed);
    this.head.add(dir);
    this.body.push(this.head.copy());
    while (this.body.length > this.len) this.body.shift();
  };

  Snake.prototype.grow = function () {
    this.len += 4;
    this.size += 0.15;
  };

  Snake.prototype.show = function () {
    p.noStroke();
    for (var i = 0; i < this.body.length; i++) {
      var pos = this.body[i];
      var s = p.map(i, 0, this.body.length, this.size * 0.5, this.size);
      p.fill(0, 200, 255);
      p.circle(pos.x, pos.y, s);
    }
  };

  // ─── HEALTH BAR ──────────────────────────────────────
  function drawHealthBar() {
    var barW = 200, barH = 6;
    var x = p.width / 2 - barW / 2, y = 28;
    var fill = (snakeHealth / 100) * barW;
    var r, g, b;
    if (snakeHealth > 60) {
      var t = (snakeHealth - 60) / 40;
      r = 0; g = p.lerp(200, 255, t); b = p.lerp(255, 150, t);
    } else if (snakeHealth > 25) {
      var t = (snakeHealth - 25) / 35;
      r = p.lerp(255, 0, t); g = 200; b = p.lerp(0, 255, t);
    } else {
      var pulse = 0.6 + 0.4 * Math.sin(performance.now() * 0.015);
      r = 255; g = p.lerp(0, 180, snakeHealth / 25) * pulse; b = 0;
    }
    p.noStroke();
    p.fill(255, 255, 255, 20);
    p.rect(x, y, barW, barH, 3);
    p.fill(r, g, b, 220);
    p.rect(x, y, fill, barH, 3);
    if (snakeHealth < 25) {
      p.fill(r, g, b, 40);
      p.rect(x - 2, y - 2, barW + 4, barH + 4, 4);
    }
    p.textFont('monospace'); p.textSize(8); p.textAlign(p.CENTER);
    p.fill(r, g, b, 180);
    p.text('FEED RATE', p.width / 2, y - 6);
    p.textSize(7); p.fill(255, 255, 255, 50);
    p.text('5 DOTS/SEC REQUIRED', p.width / 2, y + barH + 10);
  }

  // ─── FAILURE ─────────────────────────────────────────
  function triggerFailure(reason) {
    if (failureShown) return;
    failureShown = true;
    failureReason = reason || "starved";
    window.gameState = "failed";
    ufos = [];
    showFailureScreen();
  }

  function showFailureScreen() {
    if (document.getElementById("failure-overlay")) return;
    var sub = failureReason === "caught"
      ? "YOU WERE ABDUCTED BY THE ALIEN FLEET"
      : "THE ENTITY STARVED AND DISSOLVED";
    var overlay = document.createElement("div");
    overlay.id = "failure-overlay";
    overlay.innerHTML =
      '<div class="failure-inner">' +
        '<div class="failure-glitch" data-text="SIGNAL LOST">SIGNAL LOST</div>' +
      '</div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(function() {
      requestAnimationFrame(function() { overlay.classList.add("visible"); });
    });
    overlay.addEventListener("click", function() {
      overlay.classList.remove("visible");
      setTimeout(function() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        ["chapter-end-overlay","decision-overlay","endingYes-overlay","endingNo-overlay"].forEach(function(id) {
          var el = document.getElementById(id);
          if (el && el.parentNode) el.parentNode.removeChild(el);
        });
        var ui = document.getElementById("ui");
        if (ui) ui.style.display = '';
        var welcome = document.getElementById("welcome");
        if (welcome) welcome.classList.remove("show");
        window.gameState = "intro";
        window.foods = [];
        window.Chapter1generated = false;
        window.Chapter2generated = false;
        window.Chapter3generated = false;
        resetSnake();
        generateTextPoints("We are human.");
        generateRandomFood(150);
      }, 800);
    });
  }

  // ─── UFO SYSTEM ──────────────────────────────────────
  function spawnUFOs(count) {
    ufos = [];
    for (var i = 0; i < count; i++) {
      // Spawn each UFO at a random edge of the screen
      var edge = Math.floor(Math.random() * 4);
      var x, y;
      if (edge === 0)      { x = p.random(p.width); y = -60; }
      else if (edge === 1) { x = p.random(p.width); y = p.height + 60; }
      else if (edge === 2) { x = -60; y = p.random(p.height); }
      else                 { x = p.width + 60; y = p.random(p.height); }
      // Stagger speeds so multiple UFOs don't stack on top of each other
      ufos.push(new UFO(x, y, 0.8 + i * 0.3));
    }
  }

  function updateUFOs() {
    for (var i = 0; i < ufos.length; i++) {
      ufos[i].update();
      ufos[i].draw();
      if (ufos[i].collides(snake.head, snake.size)) {
        triggerFailure("caught");
        return;
      }
    }
  }

  function UFO(startX, startY, spd) {
    this.pos = p.createVector(startX, startY);
    this.speed = spd;
    this.wobbleOffset = p.random(1000); // so each UFO wobbles independently
    this.beamFlicker = 0;
    this.lightAngle = 0;
  }

  UFO.prototype.update = function() {
    // Chase the snake head with slight wobble perpendicular to direction
    var target = snake.head.copy();
    var dir = p5.Vector.sub(target, this.pos);
    var d = dir.mag();

    // Add a sinusoidal wobble perpendicular to movement direction
    dir.normalize();
    var perp = p.createVector(-dir.y, dir.x);
    var wobble = Math.sin(p.frameCount * 0.05 + this.wobbleOffset) * 1.5;
    var move = p5.Vector.add(
      p5.Vector.mult(dir, this.speed),
      p5.Vector.mult(perp, wobble)
    );
    this.pos.add(move);

    this.beamFlicker = 0.6 + 0.4 * Math.sin(p.frameCount * 0.12 + this.wobbleOffset);
    this.lightAngle += 0.04;
  };

  UFO.prototype.collides = function(headPos, headSize) {
    var d = p.dist(this.pos.x, this.pos.y, headPos.x, headPos.y);
    return d < (28 + headSize * 0.5); // disc radius ~28 + half the snake head
  };

  UFO.prototype.draw = function() {
    var x = this.pos.x, y = this.pos.y;

    p.push();
    p.translate(x, y);



    // ── disc body ─────────────────────────────────────
    // Shadow/glow underneath
    p.fill(0, 200, 255, 18);
    p.ellipse(0, 6, 70, 18);

    // Main disc
    p.fill(15, 15, 25);
    p.ellipse(0, 2, 60, 14);

    // Disc highlight rim
    p.fill(0, 180, 255, 120);
    p.ellipse(0, 0, 60, 12);

    // Disc sheen
    p.fill(80, 220, 255, 60);
    p.ellipse(-8, -1, 30, 5);

    // ── dome ──────────────────────────────────────────
    p.fill(10, 10, 20, 230);
    p.ellipse(0, -4, 30, 18);

    // Dome glass tint
    p.fill(0, 200, 255, 30);
    p.ellipse(0, -5, 28, 16);

    // Dome highlight
    p.fill(150, 230, 255, 80);
    p.ellipse(-5, -8, 10, 6);

    // ── rotating lights around disc rim ───────────────
    var numLights = 6;
    for (var i = 0; i < numLights; i++) {
      var angle = this.lightAngle + (i / numLights) * p.TWO_PI;
      var lx = Math.cos(angle) * 24;
      var ly = Math.sin(angle) * 5 + 2;
      var brightness = 0.5 + 0.5 * Math.sin(angle * 2 + p.frameCount * 0.1);
      // Alternate green/cyan lights
      if (i % 2 === 0) p.fill(0, 255, 150, 200 * brightness);
      else             p.fill(0, 200, 255, 200 * brightness);
      p.circle(lx, ly, 4);
    }

    // ── antenna ───────────────────────────────────────
    p.stroke(0, 200, 255, 120);
    p.strokeWeight(1);
    p.line(0, -13, 0, -20);
    p.noStroke();
    p.fill(0, 255, 150, 180);
    p.circle(0, -21, 4);

    p.pop();
  };

  function showChapterEndUI(bottomText, btnLabel, onNext) {
    if (document.getElementById("chapter-end-overlay")) return;

    var overlay = document.createElement("div");
    overlay.id = "chapter-end-overlay";
    overlay.innerHTML =
      '<div class="chapter-end-text">' + bottomText + '</div>' +
      '<div class="btn-wrap chapter-end-btn-wrap">' +
        '<canvas class="dots-canvas chapter-end-dots-canvas"></canvas>' +
        '<button class="chapter-end-btn">' + btnLabel + '</button>' +
      '</div>';
    document.body.appendChild(overlay);

    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        overlay.classList.add("visible");
        var btnWrap = overlay.querySelector(".chapter-end-btn-wrap");
        var dotCanvas = overlay.querySelector(".chapter-end-dots-canvas");
        if (dotCanvas && btnWrap) {
          dotCanvas.width = btnWrap.offsetWidth;
          dotCanvas.height = btnWrap.offsetHeight;
          drawDotBorderLocal(dotCanvas, "rgba(0,200,255,0.5)");
        }
      });
    });

    overlay.querySelector(".chapter-end-btn").addEventListener("click", onNext);
  }

  function removeChapterEndUI() {
    var el = document.getElementById("chapter-end-overlay");
    if (el) {
      el.classList.remove("visible");
      setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 600);
    }
  }

  function showDecisionUI() {
    if (document.getElementById("decision-overlay")) return;

    var overlay = document.createElement("div");
    overlay.id = "decision-overlay";
    overlay.innerHTML =
      '<div class="decision-question">Should we send out a radio signal?</div>' +
      '<div class="decision-btns">' +
        '<div class="btn-wrap decision-btn-wrap">' +
          '<canvas class="dots-canvas decision-dots-yes"></canvas>' +
          '<button class="decision-btn yes-btn">YES</button>' +
        '</div>' +
        '<div class="btn-wrap decision-btn-wrap">' +
          '<canvas class="dots-canvas decision-dots-no"></canvas>' +
          '<button class="decision-btn no-btn">NO</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        overlay.classList.add("visible");
        var wraps = overlay.querySelectorAll(".decision-btn-wrap");
        var canvases = [overlay.querySelector(".decision-dots-yes"), overlay.querySelector(".decision-dots-no")];
        canvases.forEach(function(c, idx) {
          if (c && wraps[idx]) {
            c.width = wraps[idx].offsetWidth;
            c.height = wraps[idx].offsetHeight;
            drawDotBorderLocal(c, idx === 0 ? "rgba(0,255,150,0.5)" : "rgba(0,200,255,0.5)");
          }
        });
      });
    });

    overlay.querySelector(".yes-btn").addEventListener("click", function() {
      overlay.classList.remove("visible");
      setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 600);
      showEndingScreen(
        "endingYes",
        ["Radio signal sent.", "It was received by an unknown.", "They are coming."],
        ["var(--green)", "rgba(255,255,255,0.85)", "var(--green)"]
      );
      window.gameState = "endingYes";
    });

    overlay.querySelector(".no-btn").addEventListener("click", function() {
      overlay.classList.remove("visible");
      setTimeout(function() { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 600);
      showEndingScreen(
        "endingNo",
        ["Peace in the solar system continues.", "But not for much longer."],
        ["var(--cyan)", "rgba(255,255,255,0.6)"]
      );
      window.gameState = "endingNo";
    });
  }

  function showEndingScreen(id, lines, colors) {
    if (document.getElementById(id + "-overlay")) return;

    var overlay = document.createElement("div");
    overlay.id = id + "-overlay";
    overlay.className = "ending-overlay";

    var inner = '<div class="ending-lines">';
    lines.forEach(function(line, i) {
      inner += '<div class="ending-line" style="color:' + colors[i] + ';text-shadow:0 0 40px ' + colors[i] + '">' + line + '</div>';
    });
    inner += '</div>';
    overlay.innerHTML = inner;
    document.body.appendChild(overlay);

    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        overlay.classList.add("visible");
      });
    });
  }

  function drawDotBorderLocal(canvas, color, spacing) {
    spacing = spacing || 10;
    if (!canvas) return;
    var ctx = canvas.getContext("2d");
    var W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = color;
    var r = 2.5;
    var cols = Math.floor(W / spacing);
    var rows = Math.floor(H / spacing);
    var xOff = (W - (cols - 1) * spacing) / 2;
    var yOff = (H - (rows - 1) * spacing) / 2;
    for (var c = 0; c < cols; c++) {
      for (var rr = 0; rr < rows; rr++) {
        if (c === 0 || c === cols - 1 || rr === 0 || rr === rows - 1) {
          ctx.beginPath();
          ctx.arc(xOff + c * spacing, yOff + rr * spacing, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

});