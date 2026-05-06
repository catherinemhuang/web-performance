new p5(function (p) {

  let snake;
  let lastNoteTime = 0;
  var notes = ['C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','G5','A5'];

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

    generateTextPoints("We are human.");
    generateRandomFood(150);
  };

  p.mousePressed = function () {
    unlockAudio();
  };

  p.draw = function () {
    p.background(10);

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
  };

  function Chapter1() {
    if (!window.Chapter1generated) {
      window.foods = [];
      generateTextPoints("Are we alone in this universe?");
      generateRandomFood(80);
      window.Chapter1generated = true;
    }
    drawFoods();
  }

  function Chapter2() {
    if (!window.Chapter2generated) {
      window.foods = [];
      generateTextPoints("What could be out there?");
      generateRandomFood(80);
      window.Chapter2generated = true;
    }
    drawFoods();
  }

  function Chapter3() {
    if (!window.Chapter3generated) {
      window.foods = [];
      generateTextPoints("Are they like us?");
      generateRandomFood(80);
      window.Chapter3generated = true;
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