let handshake = document.querySelector("#handshake");

handshake.addEventListener("click", async () => {
  await Tone.start();
  handshake.style.display = "none";
});

new p5(function (p) {

  let snake;
  let lastNoteTime = 0;
  var notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'G5', 'A5'];

  // ─── HEALTH / DECAY SYSTEM ───────────────────────────
  var snakeHealth = 100;
  var lastEatTime = 0;
  var HEALTH_DRAIN_PER_MS = 0.02;
  var HEALTH_PER_EAT = 3;
  var MIN_SNAKE_SIZE = 3;
  var failureShown = false;
  var ufos = [];
  var failureReason = "starved";

  // ─── DECISION STATE ──────────────────────────────────
  var decisionYesLeft = 0;
  var decisionNoLeft = 0;
  var decisionActive = false;

  // ─── FAILURE CHAPTER TRACKING ────────────────────────
  var lastActiveChapter = "Chapter1";

  // ─── THE END GAME STATE ──────────────────────────────
  var theEndDots = [];
  var bullets = [];
  var shootCooldown = 0;
  var theEndCleared = false;

  var synth = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.05, release: 0.4 },
    volume: -12
  }).toDestination();

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

    // Show "THE VOID" as Asimovian font HTML overlay on intro
    showIntroTitle();
    generateRandomFood(150);
    spawnIntroButtonDots();
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
          function () {
            window.gameState = "Chapter2";
            snake.speed *= 1.25;
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
          function () {
            window.gameState = "Chapter3";
            snake.speed *= 1.4;
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
      window.gameState === "Chapter2complete") {
      drawFoods();
      snake.update();
      snake.show();
      checkEating();
    }

    if (window.gameState === "Chapter3complete") {
      drawFoods();
      snake.update();
      snake.show();
      checkEating();
    }

    if (window.gameState === "endingYes" || window.gameState === "endingNo") {
      snake.update();
      snake.show();
    }

    if (window.gameState === "theEnd") {
      drawTheEndGame();
    }

    if (isChapterActive && !failureShown) {
      drawHealthBar();
    }
  };

  // ─── CHAPTERS ────────────────────────────────────────

  function Chapter1() {
    if (!window.Chapter1generated) {
      window.foods = [];
      removeIntroTitle();
      generateTextPoints("Are we alone here?", 0);
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
      generateTextPoints("What could be out there?", 2);
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
      generateTextPoints("Are they like us?", 3);
      generateRandomFood(80);
      window.Chapter3generated = true;
      snakeHealth = 100;
      lastEatTime = performance.now();
      failureShown = false;
      spawnUFOs(3);
    }
    drawFoods();
  }

  // ─── INTRO TITLE ─────────────────────────────────────

  function showIntroTitle() {
    if (document.getElementById('intro-title')) return;
    var el = document.createElement('div');
    el.id = 'intro-title';
    el.textContent = 'THE VOID';
    el.style.cssText = [
      'position:fixed',
      'top:20%',
      'font-family:"MyFont",sans-serif',
      'font-size:clamp(72px,14vw,160px)',
      'letter-spacing:0.12em',
      'color:rgba(0, 255, 145, 0.92)',
      'pointer-events:none',
      'z-index:5',
      'user-select:none',
      'white-space:nowrap',
      'text-align:center',
      'width:100%',
      'text-shadow:0 0 60px rgba(0,200,255,0.35)',
      'animation:pulse 5.5s ease-in-out infinite'
    ].join(';');
    document.body.appendChild(el);
  }


  function removeIntroTitle() {
    var el = document.getElementById('intro-title');
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function triggerWelcomeScreen() {
    // Clear all intro button dots (text + border) immediately
    window.foods = window.foods.filter(function(f) { return !f.isIntroBtn; });
    introBtnDotsLeft = 0;

    var welcome = document.getElementById('welcome');
    var welcomeText = document.getElementById('welcome-text');
    if (!welcome || !welcomeText) return;

    // Hide the LET'S GO button entirely — no button needed
    var startBtn1 = document.getElementById('start-btn1');
    if (startBtn1) startBtn1.style.display = 'none';

    var fullText = 'WELCOME, STRANGER';
    var idx = 0;

    welcome.style.display = 'flex';
    welcome.style.zIndex = '500';
    welcomeText.textContent = '';

    requestAnimationFrame(function() {
      requestAnimationFrame(function() { welcome.classList.add('show'); });
    });

    // Letter-by-letter typewriter
    var typeInterval = setInterval(function() {
      if (idx < fullText.length) {
        welcomeText.textContent = fullText.slice(0, idx + 1);
        idx++;
      } else {
        clearInterval(typeInterval);
      }
    }, 80);

    // Auto-advance to Chapter 1 after 5 seconds
    setTimeout(function() {
      welcome.classList.remove('show');
      welcome.style.display = '';
      welcome.style.zIndex = '';
      if (startBtn1) startBtn1.style.display = '';

      window.gameState = 'Chapter1';
      window.foods = [];
      window.Chapter1generated = false;
      if (window.resetSnake) window.resetSnake();
    }, 3000);
  }



  var introBtnDotsLeft = 0;
  var introBtnSpawned = false;

  function spawnIntroButtonDots() {
    // Hide the HTML button — dots replace it
    var uiEl = document.getElementById('ui');
    if (uiEl) uiEl.style.display = 'none';

    introBtnDotsLeft = 0;
    introBtnSpawned = false;

    var label = "LET'S START";
    var btnW = 480, btnH = 110;
    var cx = p.width / 2;
    var cy = p.height * 0.62;
    var x0 = cx - btnW / 2;
    var y0 = cy - btnH / 2;

    var off = document.createElement('canvas');
    off.width = p.width;
    off.height = p.height;
    var ctx = off.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, off.width, off.height);

    // Draw button label text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, cy);

    var pixels = ctx.getImageData(0, 0, p.width, p.height).data;
    var step = 8;

    // Stagger spawn so dots flicker in over time
    var allDots = [];

    // Text dots
    for (var x = 0; x < p.width; x += step) {
      for (var y = 0; y < p.height; y += step) {
        var i4 = (x + y * p.width) * 4;
        if (pixels[i4] > 50) {
          allDots.push({ pos: p.createVector(x, y), isIntroBtn: true, isText: true, flickerOffset: Math.random() * 100 });
        }
      }
    }

    // Shuffle so they flicker in randomly
    for (var s = allDots.length - 1; s > 0; s--) {
      var j = Math.floor(Math.random() * (s + 1));
      var tmp = allDots[s]; allDots[s] = allDots[j]; allDots[j] = tmp;
    }

    // Stagger adding them to window.foods over ~1.5s
    var delay = 1500 / allDots.length;
    var spawnStart = performance.now();
    allDots.forEach(function(dot, idx) {
      setTimeout(function() {
        dot.spawnedAt = performance.now();
        window.foods.push(dot);
        introBtnDotsLeft++;
        if (idx === allDots.length - 1) introBtnSpawned = true;
      }, idx * delay);
    });
  }



  function generateTextPoints(txt, scatter) {
    scatter = scatter || 0;
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
    var step = 8;

    for (var x = 0; x < p.width; x += step) {
      for (var y = 0; y < p.height; y += step) {
        var i = (x + y * p.width) * 4;
        if (pixels[i] > 50) {
          var ox = scatter > 0 ? p.random(-scatter, scatter) : 0;
          var oy = scatter > 0 ? p.random(-scatter, scatter) : 0;
          window.foods.push({ pos: p.createVector(x + ox, y + oy), isText: true });
        }
      }
    }
  }

  function generateRandomFood(n) {
    for (var i = 0; i < n; i++) {
      window.foods.push({
        pos: p.createVector(p.random(p.width), p.random(p.height)),
        isText: false,
        vx: p.random(-0.3, 0.3),
        vy: p.random(-0.3, 0.3),
        blinkOffset: p.random(1000)
      });
    }
  }

  // ─── DRAW FOODS ───────────────────────────────────────

  function drawFoods() {
    p.noStroke();
    window.foods.forEach(function (f) {
      if (!f.isText && f.vx !== undefined) {
        f.pos.x += f.vx;
        f.pos.y += f.vy;
        if (f.pos.x < 0) f.pos.x = p.width;
        if (f.pos.x > p.width) f.pos.x = 0;
        if (f.pos.y < 0) f.pos.y = p.height;
        if (f.pos.y > p.height) f.pos.y = 0;
      }

      if (f.choice === 'yes') {
        p.fill(0, 255, 150);
      } else if (f.choice === 'no') {
        p.fill(0, 200, 255);
      } else if (f.isNextChapter) {
        var age = (performance.now() - (f.spawnedAt || 0)) / 1000;
        var solidT = Math.min(1, Math.max(0, (age - 1) / 0.6)); // 0→1 over 0.6s after 1s
        var flicker = 80 + 175 * Math.sin((p.frameCount * 0.018) + (f.flickerOffset || 0));
        var alpha = flicker * (1 - solidT) + 230 * solidT;
        p.fill(0, 255, 150, alpha);
      } else if (f.isIntroBtn) {
        var age = (performance.now() - (f.spawnedAt || 0)) / 1000;
        var solidT = Math.min(1, Math.max(0, (age - 1) / 0.6));
        var introFlicker = 100 + 155 * Math.sin((p.frameCount * 0.025) + (f.flickerOffset || 0));
        var alpha = introFlicker * (1 - solidT) + 230 * solidT;
        p.fill(255, 71, 227, alpha);
      } else if (f.isText) {
        p.fill(255);
      } else {
        var blink = 120 + 135 * Math.sin((p.frameCount * 0.04) + (f.blinkOffset || 0));
        p.fill(0, 255, 150, blink);
      }
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

  // ─── EAT LOGIC ───────────────────────────────────────

  function checkEating() {
    var eaten = 0;
    var maxPerFrame = 3;
    for (var i = window.foods.length - 1; i >= 0 && eaten < maxPerFrame; i--) {
      var d = p.dist(snake.head.x, snake.head.y, window.foods[i].pos.x, window.foods[i].pos.y);
      if (d < snake.size) {
        var wasText = window.foods[i].isText;
        var isNextChapter = window.foods[i].isNextChapter;
        var isIntroBtn = window.foods[i].isIntroBtn;
        var choice = window.foods[i].choice;
        window.foods.splice(i, 1);
        eaten++;

        // Intro button dots — trigger welcome when all eaten
        if (isIntroBtn) {
          introBtnDotsLeft--;
          if (introBtnSpawned && introBtnDotsLeft <= 0) {
            introBtnDotsLeft = 0;
            triggerWelcomeScreen();
            return;
          }
        }

        if (isNextChapter) {
          nextChapterDotsLeft--;
          if (nextChapterDotsLeft <= 0 && nextChapterCallback) {
            var cb = nextChapterCallback;
            nextChapterCallback = null;
            nextChapterDotsLeft = 0;
            cb();
            return;
          }
        }

        if (decisionActive) {
          if (choice === 'yes') decisionYesLeft--;
          if (choice === 'no') decisionNoLeft--;

          if (choice === 'yes' && decisionYesLeft <= 0) {
            decisionActive = false;
            window.foods = [];
            window.gameState = "endingYes";
            var dl = document.getElementById('decision-label');
            if (dl && dl.parentNode) dl.parentNode.removeChild(dl);
            showEndingScreen(
              "endingYes",
              ["Radio signal sent.", "It was received by an unknown.", "They are coming."],
              ["var(--green)", "rgba(255,255,255,0.85)", "var(--green)"]
            );
            return;
          }

          if (choice === 'no' && decisionNoLeft <= 0) {
            decisionActive = false;
            window.foods = [];
            window.gameState = "endingNo";
            var dl = document.getElementById('decision-label');
            if (dl && dl.parentNode) dl.parentNode.removeChild(dl);
            showEndingScreen(
              "endingNo",
              ["Peace in the solar system continues.", "But not for much longer."],
              ["var(--cyan)", "rgba(255,255,255,0.6)"]
            );
            return;
          }
        }

        if (!wasText && !isIntroBtn &&
          window.gameState !== "Chapter1complete" &&
          window.gameState !== "Chapter2complete" &&
          window.gameState !== "Chapter3complete") {
          window.foods.push({
            pos: p.createVector(p.random(p.width), p.random(p.height)),
            isText: false,
            vx: p.random(-0.3, 0.3),
            vy: p.random(-0.3, 0.3),
            blinkOffset: p.random(1000)
          });
        }

        snake.grow();

        snakeHealth = Math.min(100, snakeHealth + HEALTH_PER_EAT);
        lastEatTime = performance.now();

        var now = performance.now();
        if (now - lastNoteTime > 80) {
          lastNoteTime = now;
          var note = notes[Math.floor(Math.random() * notes.length)];
          synth.triggerAttackRelease(note, "16n");
        }
      }
    }
  }

  // ─── SNAKE ───────────────────────────────────────────

  function resetSnake() {
    snake.body = [];
    snake.head = p.createVector(p.width / 2, p.height / 2);
    snake.body.push(snake.head.copy());
    snake.len = 25;
    snake.size = 10;
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
    if (window.gameState === "Chapter1" ||
      window.gameState === "Chapter2" ||
      window.gameState === "Chapter3") {
      lastActiveChapter = window.gameState;
    }
    window.gameState = "failed";
    ufos = [];
    showFailureScreen();
  }

  function showFailureScreen() {
    if (document.getElementById("failure-overlay")) return;
    var overlay = document.createElement("div");
    overlay.id = "failure-overlay";
    overlay.innerHTML =
      '<div class="failure-inner">' +
      '<div class="failure-glitch" data-text="SIGNAL LOST">SIGNAL LOST</div>' +
      '</div>';
    document.body.appendChild(overlay);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { overlay.classList.add("visible"); });
    });
    overlay.addEventListener("click", function () {
      overlay.classList.remove("visible");
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        ["chapter-end-overlay", "decision-overlay", "endingYes-overlay", "endingNo-overlay", "decision-label"].forEach(function (id) {
          var el = document.getElementById(id);
          if (el && el.parentNode) el.parentNode.removeChild(el);
        });
        window.foods = [];
        window.Chapter1generated = false;
        window.Chapter2generated = false;
        window.Chapter3generated = false;
        decisionActive = false;
        decisionYesLeft = 0;
        decisionNoLeft = 0;
        resetSnake();
        if (lastActiveChapter === "Chapter2") {
          snake.speed = 2.5 * 1.25;
        } else if (lastActiveChapter === "Chapter3") {
          snake.speed = 2.5 * 1.25 * 1.4;
        } else {
          snake.speed = 2.5;
        }
        window.gameState = lastActiveChapter;
      }, 800);
    });
  }

  // ─── UFO SYSTEM ──────────────────────────────────────

  function spawnUFOs(count) {
    ufos = [];
    for (var i = 0; i < count; i++) {
      var edge = Math.floor(Math.random() * 4);
      var x, y;
      if (edge === 0) { x = p.random(p.width); y = -60; }
      else if (edge === 1) { x = p.random(p.width); y = p.height + 60; }
      else if (edge === 2) { x = -60; y = p.random(p.height); }
      else { x = p.width + 60; y = p.random(p.height); }
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
    this.wobbleOffset = p.random(1000);
    this.beamFlicker = 0;
    this.lightAngle = 0;
  }

  UFO.prototype.update = function () {
    var target = snake.head.copy();
    var dir = p5.Vector.sub(target, this.pos);
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

  UFO.prototype.collides = function (headPos, headSize) {
    var d = p.dist(this.pos.x, this.pos.y, headPos.x, headPos.y);
    return d < (28 + headSize * 0.5);
  };

    UFO.prototype.draw = function () {
  var x = this.pos.x, y = this.pos.y;
  p.push();
  p.translate(x, y);

  var outerR = 22;
  var innerR = 22 * (1 - 30 / 100);
  var spikes = 3;
  var pulse = 0.6 + 0.4 * Math.sin(p.frameCount * 0.0560 + this.wobbleOffset);

  p.noStroke();
  p.fill(235, 0, 94, 20);
  p.circle(0, 0, (outerR + 9 + 18) * 2);
  p.fill(235, 0, 94, 38);
  p.circle(0, 0, (outerR + 9) * 2);

  p.push();
  p.rotate(this.lightAngle * 0.0180 / 0.0180 * 0.4);
  p.stroke(235, 0, 94, 150);
  p.strokeWeight(1);
  p.noFill();
  p.beginShape();
  for (var i = 0; i < 12; i++) {
    var a = (i / 12) * p.TWO_PI;
    var r = (i % 2 === 0) ? 36 : 36 * 0.42;
    p.vertex(Math.cos(a) * r, Math.sin(a) * r);
  }
  p.endShape(p.CLOSE);
  p.strokeWeight(1.5);
  p.stroke(235, 0, 94, 230);
  for (var i = 0; i < 4; i++) {
    var a = (i / 4) * p.TWO_PI;
    p.line(Math.cos(a)*(36+2), Math.sin(a)*(36+2), Math.cos(a)*(36+12), Math.sin(a)*(36+12));
  }
  p.strokeWeight(0.9);
  p.stroke(235, 0, 94, 150);
  for (var i = 0; i < 4; i++) {
    var a = ((i+0.5)/4)*p.TWO_PI;
    p.line(Math.cos(a)*(26), Math.sin(a)*(26), Math.cos(a)*(26+9), Math.sin(a)*(26+9));
  }
  p.pop();

  p.push();
  p.rotate(-this.lightAngle);
  p.fill(127, 5, 5);
  p.stroke(28, 3, 3);
  p.strokeWeight(1.4);
  p.beginShape();
  for (var i = 0; i < spikes * 2; i++) {
    var a = (i / (spikes * 2)) * p.TWO_PI - p.HALF_PI;
    var r = (i % 2 === 0) ? outerR : innerR;
    p.vertex(Math.cos(a) * r, Math.sin(a) * r);
  }
  p.endShape(p.CLOSE);

  p.stroke(255, 0, 187);
  p.strokeWeight(1.6);
  p.line(-10, 0, 10, 0);
  p.line(0, -10, 0, 10);

  p.strokeWeight(1.1);
  p.line(-11, -11, 11, 11);
  p.line(11, -11, -11, 11);

  p.noFill();
  p.strokeWeight(1);
  p.beginShape();
  p.vertex(0, -16); p.vertex(16, 0);
  p.vertex(0, 16); p.vertex(-16, 0);
  p.endShape(p.CLOSE);

  p.stroke(28, 3, 3);
  p.strokeWeight(1.4);
  var br = outerR * 0.75, bk = 7;
  p.beginShape(); p.vertex(-br, -(br-bk)); p.vertex(-br, -br); p.vertex(-(br-bk), -br); p.endShape();
  p.beginShape(); p.vertex(br-bk, -br); p.vertex(br, -br); p.vertex(br, -(br-bk)); p.endShape();
  p.beginShape(); p.vertex(br, br-bk); p.vertex(br, br); p.vertex(br-bk, br); p.endShape();
  p.beginShape(); p.vertex(-(br-bk), br); p.vertex(-br, br); p.vertex(-br, br-bk); p.endShape();
  p.pop();

  p.noStroke();
  p.fill(165, 67, 177, 255 * pulse);
  p.beginShape();
  p.vertex(0, -9); p.vertex(9, 0);
  p.vertex(0, 9); p.vertex(-9, 0);
  p.endShape(p.CLOSE);
  p.fill(255, 245, 220, 220 * pulse);
  p.circle(0, 0, 6);

  p.pop();
};

  // ─── CHAPTER END UI ──────────────────────────────────

  function showChapterEndUI(bottomText, btnLabel, onNext) {
    if (document.getElementById("chapter-end-overlay")) return;

    // Register the onNext callback globally so eating logic can call it
    window._chapterNextCallback = null;

    var overlay = document.createElement("div");
    overlay.id = "chapter-end-overlay";
    overlay.innerHTML = '<div class="chapter-end-text"></div>';
    document.body.appendChild(overlay);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add("visible");

        // ── Typewriter — letter by letter, no blink ──
        var textEl = overlay.querySelector(".chapter-end-text");
        var idx = 0;

        var typeInterval = setInterval(function () {
          if (idx < bottomText.length) {
            textEl.textContent = bottomText.slice(0, idx + 1);
            idx++;
          } else {
            clearInterval(typeInterval);
            // After typing finishes, spawn the edible dot label
            setTimeout(function () {
              spawnNextChapterDots(onNext);
            }, 400);
          }
        }, 55);
      });
    });
  }

  // ─── Spawn "NEXT CHAPTER →" as edible p5 dot-text ────

  var nextChapterDotsLeft = 0;
  var nextChapterCallback = null;

  function spawnNextChapterDots(onNext) {
    nextChapterDotsLeft = 0;
    nextChapterCallback = onNext;

    var labelText = 'NEXT CHAPTER';
    var off = document.createElement('canvas');
    off.width = p.width;
    off.height = p.height;
    var ctx = off.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, off.width, off.height);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 72px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labelText, p.width / 2, p.height * 0.78);

    var pixels = ctx.getImageData(0, 0, off.width, off.height).data;
    var step = 9;
    var allDots = [];
    for (var x = 0; x < p.width; x += step) {
      for (var y = 0; y < p.height; y += step) {
        var i4 = (x + y * p.width) * 4;
        if (pixels[i4] > 50) {
          allDots.push(p.createVector(x, y));
          nextChapterDotsLeft++;
        }
      }
    }

    // Stagger dots appearing over ~2 seconds with individual flicker offsets
    var totalDots = allDots.length;
    allDots.forEach(function (pos, i) {
      var delay = (i / totalDots) * 2000 + p.random(0, 400);
      setTimeout(function () {
        window.foods.push({
          pos: pos,
          isText: true,
          isNextChapter: true,
          flickerOffset: p.random(1000),
          spawnedAt: performance.now()
        });
      }, delay);
    });
  }

  function removeChapterEndUI() {
    var el = document.getElementById("chapter-end-overlay");
    if (el) {
      el.classList.remove("visible");
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 600);
    }
    nextChapterDotsLeft = 0;
    nextChapterCallback = null;
  }

  // ─── DECISION UI ─────────────────────────────────────

  function showDecisionUI() {
    decisionActive = true;
    decisionYesLeft = 0;
    decisionNoLeft = 0;
    window.foods = [];

    var step = 8;

    var labelEl = document.createElement('div');
    labelEl.id = 'decision-label';
    labelEl.style.cssText = 'position:fixed;top:18%;left:0;right:0;text-align:center;font-family:\'Space Mono\',monospace;font-size:18px;letter-spacing:0.3em;color:#fff;pointer-events:none;z-index:50;text-transform:uppercase;';
    labelEl.textContent = 'Send a radio signal?';
    document.body.appendChild(labelEl);

    // YES — left side
    var yesCanvas = document.createElement('canvas');
    yesCanvas.width = p.width;
    yesCanvas.height = p.height;
    var yesCtx = yesCanvas.getContext('2d');
    yesCtx.fillStyle = 'black';
    yesCtx.fillRect(0, 0, p.width, p.height);
    yesCtx.fillStyle = 'white';
    yesCtx.font = 'bold 120px monospace';
    yesCtx.textAlign = 'center';
    yesCtx.textBaseline = 'middle';
    yesCtx.fillText('YES', p.width * 0.28, p.height * 0.58);

    var yesPixels = yesCtx.getImageData(0, 0, p.width, p.height).data;
    for (var x = 0; x < p.width; x += step) {
      for (var y = 0; y < p.height; y += step) {
        var idx = (x + y * p.width) * 4;
        if (yesPixels[idx] > 50) {
          window.foods.push({ pos: p.createVector(x, y), isText: true, choice: 'yes' });
          decisionYesLeft++;
        }
      }
    }

    // NO — right side
    var noCanvas = document.createElement('canvas');
    noCanvas.width = p.width;
    noCanvas.height = p.height;
    var noCtx = noCanvas.getContext('2d');
    noCtx.fillStyle = 'black';
    noCtx.fillRect(0, 0, p.width, p.height);
    noCtx.fillStyle = 'white';
    noCtx.font = 'bold 120px monospace';
    noCtx.textAlign = 'center';
    noCtx.textBaseline = 'middle';
    noCtx.fillText('NO', p.width * 0.72, p.height * 0.58);

    var noPixels = noCtx.getImageData(0, 0, p.width, p.height).data;
    for (var x = 0; x < p.width; x += step) {
      for (var y = 0; y < p.height; y += step) {
        var idx = (x + y * p.width) * 4;
        if (noPixels[idx] > 50) {
          window.foods.push({ pos: p.createVector(x, y), isText: true, choice: 'no' });
          decisionNoLeft++;
        }
      }
    }
  }

  // ─── ENDING SCREEN ───────────────────────────────────

  function showEndingScreen(id, lines, colors) {
    if (document.getElementById(id + "-overlay")) return;

    var overlay = document.createElement("div");
    overlay.id = id + "-overlay";
    overlay.className = "ending-overlay";

    // Build empty line elements — typewriter fills them in
    var inner = '<div class="ending-lines">';
    lines.forEach(function (line, i) {
      inner += '<div class="ending-line" style="color:' + colors[i] + ';text-shadow:0 0 40px ' + colors[i] + ';opacity:1;transform:none;animation:none;"></div>';
    });
    inner += '</div>';
    overlay.innerHTML = inner;
    document.body.appendChild(overlay);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add("visible");

        var lineEls = overlay.querySelectorAll(".ending-line");
        var CHAR_MS = 55;
        var PAUSE_BETWEEN = 500; // ms gap between lines

        // Type lines one after another — no cursor, just letter-by-letter reveal
        function typeLine(lineIdx) {
          if (lineIdx >= lines.length) return;

          var el = lineEls[lineIdx];
          var text = lines[lineIdx];
          var idx = 0;
          el.textContent = '';

          var typeInterval = setInterval(function () {
            if (idx < text.length) {
              el.textContent = text.slice(0, idx + 1);
              idx++;
            } else {
              clearInterval(typeInterval);
              setTimeout(function () {
                typeLine(lineIdx + 1);
              }, PAUSE_BETWEEN);
            }
          }, CHAR_MS);
        }

        typeLine(0);
      });
    });

    // Calculate total type time then add buffer before transitioning
    var totalChars = lines.reduce(function (sum, l) { return sum + l.length; }, 0);
    var estimatedMs = totalChars * 55 + lines.length * 500 + 1500;

    setTimeout(function () {
      overlay.style.transition = "opacity 1s ease";
      overlay.style.opacity = "0";
      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        initTheEndGame();
      }, 1000);
    }, estimatedMs);
  }

  // ─── DOT BORDER HELPER ───────────────────────────────

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

  // ─── THE END — SPACE INVADERS ────────────────────────

  function initTheEndGame() {
    theEndDots = [];
    bullets = [];
    shootCooldown = 0;
    theEndCleared = false;
    window.gameState = "theEnd";

    var off = document.createElement('canvas');
    off.width = p.width;
    off.height = p.height;
    var ctx = off.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, p.width, p.height);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 130px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('THE VOID', p.width / 2, p.height * 0.35);

    var pixels = ctx.getImageData(0, 0, p.width, p.height).data;
    var step = 10;
    for (var x = 0; x < p.width; x += step) {
      for (var y = 0; y < p.height; y += step) {
        var idx = (x + y * p.width) * 4;
        if (pixels[idx] > 50) {
          theEndDots.push({ x: x, y: y, alive: true });
        }
      }
    }
  }

  function drawTheEndGame() {
    // Auto-fire every 8 frames toward mouse
    shootCooldown--;
    if (shootCooldown <= 0 && p.mouseX >= 0 && p.mouseX <= p.width) {
      var bx = p.mouseX;
      var by = p.height - 30;
      var ang = Math.atan2(p.mouseY - by, p.mouseX - bx);
      if (ang >= 0) ang = -Math.PI / 2;
      var speed = 9;
      bullets.push({ x: bx, y: by, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed });
      shootCooldown = 8;
    }

    // Update & draw bullets
    p.noStroke();
    for (var i = bullets.length - 1; i >= 0; i--) {
      bullets[i].x += bullets[i].vx;
      bullets[i].y += bullets[i].vy;

      if (bullets[i].y < 0 || bullets[i].x < 0 || bullets[i].x > p.width) {
        bullets.splice(i, 1);
        continue;
      }

      var hit = false;
      for (var j = theEndDots.length - 1; j >= 0; j--) {
        if (!theEndDots[j].alive) continue;
        var d = p.dist(bullets[i].x, bullets[i].y, theEndDots[j].x, theEndDots[j].y);
        if (d < 10) {
          theEndDots[j].alive = false;
          bullets.splice(i, 1);
          hit = true;
          var nowT = performance.now();
          if (nowT - lastNoteTime > 60) {
            lastNoteTime = nowT;
            synth.triggerAttackRelease('C5', '32n');
          }
          break;
        }
      }

      if (!hit && i < bullets.length) {
        p.fill(0, 255, 150, 200);
        p.circle(bullets[i].x, bullets[i].y, 5);
        p.fill(0, 255, 150, 60);
        p.circle(bullets[i].x, bullets[i].y + 6, 7);
      }
    }

    // Draw THE END dots
    var alive = 0;
    for (var k = 0; k < theEndDots.length; k++) {
      if (!theEndDots[k].alive) continue;
      alive++;
      var flicker = 180 + 75 * Math.sin(p.frameCount * 0.04 + k * 0.3);
      p.fill(255, 255, 255, flicker);
      p.noStroke();
      p.circle(theEndDots[k].x, theEndDots[k].y, 7);
    }

    // Draw shooter at bottom following mouse
    var sx = p.constrain(p.mouseX, 20, p.width - 20);
    var sy = p.height - 30;
    p.noStroke();
    p.fill(0, 200, 255, 30);
    p.circle(sx, sy, 36);
    p.fill(0, 200, 255, 70);
    p.circle(sx, sy, 22);
    p.fill(0, 200, 255, 230);
    p.circle(sx, sy, 12);
    p.fill(0, 255, 150, 200);
    p.circle(sx, sy - 10, 5);

    // Hint label
    p.textFont('monospace');
    p.textSize(9);
    p.textAlign(p.CENTER);
    p.fill(0, 200, 255, 80);
    p.text('MOVE CURSOR — AUTO FIRE', p.width / 2, p.height - 8);

    // Check cleared
    if (alive === 0 && !theEndCleared) {
      theEndCleared = true;
      setTimeout(function () {
        var el = document.createElement('div');
        el.id = 'transmission-complete';
        el.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;z-index:9999;cursor:none;';
        el.innerHTML =
          '<div style="font-family:\'Space Mono\',monospace;font-size:clamp(14px,2.5vw,22px);letter-spacing:0.4em;color:rgba(0, 255, 149, 0.81);text-transform:uppercase;">transmission complete</div>' +
        document.body.appendChild(el);

      }, 200);
    }
  }

});