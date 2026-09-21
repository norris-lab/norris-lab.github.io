// Hero schematic: matrix protein dimers dock onto the inner leaflet of a
// membrane, and the growing lattice bends the membrane into a bud.
(function () {
  var canvas = document.getElementById("lattice");
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DURATION = 5200; // ms for the whole assembly
  var colors, W, H, dpr, dimers, spikes, strays, start = null, done = false;

  function readColors() {
    var s = getComputedStyle(document.documentElement);
    colors = {
      matrix: s.getPropertyValue("--matrix").trim() || "#0f7672",
      lipid: s.getPropertyValue("--lipid").trim() || "#b03c74",
      ink: s.getPropertyValue("--ink").trim() || "#14213a",
      slate: s.getPropertyValue("--slate").trim() || "#4f5e73",
      rule: s.getPropertyValue("--rule").trim() || "#cdd7df"
    };
  }

  // Deterministic pseudo-random so the layout is the same on every load.
  var seed = 7;
  function rand() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function clamp(x) { return Math.max(0, Math.min(1, x)); }

  function setup() {
    dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    seed = 7;
    dimers = [];
    var n = 34;
    for (var i = 0; i < n; i++) {
      var u = 0.2 + (0.6 * (i + 0.5)) / n;
      dimers.push({
        u: u,
        // start scattered in the cytoplasm below the membrane
        sx: W * (0.08 + rand() * 0.84),
        sy: H * (0.8 + rand() * 0.18),
        sa: rand() * Math.PI * 2,
        // dock from the centre outwards
        t0: 0.08 + Math.abs(u - 0.5) * 1.35 + rand() * 0.05,
        shade: i % 2
      });
    }
    spikes = [];
    for (var k = 0; k < 11; k++) spikes.push({ u: 0.3 + (0.4 * k) / 10, t0: 0.72 + rand() * 0.14 });
    strays = [];
    for (var m = 0; m < 5; m++) strays.push({ x: W * (0.1 + rand() * 0.8), y: H * (0.84 + rand() * 0.12), a: rand() * Math.PI });
  }

  // Build the membrane midline for a given bud height and return a sampler
  // that maps a fraction u of arc length to a point and inward normal.
  function membrane(bud) {
    var y0 = H * 0.7, cx = W * 0.5, s = W * 0.15, amp = H * 0.44 * bud;
    var N = 240, pts = [], len = [0];
    for (var i = 0; i <= N; i++) {
      var x = -W * 0.05 + (W * 1.1 * i) / N;
      var g = (x - cx) / s;
      // flat-topped bump: wider shoulder than a plain gaussian
      var y = y0 - amp * Math.exp(-Math.pow(Math.abs(g), 3) / 2);
      pts.push([x, y]);
      if (i) len.push(len[i - 1] + Math.hypot(x - pts[i - 1][0], y - pts[i - 1][1]));
    }
    var total = len[N];
    return function (u) {
      var target = u * total, lo = 0, hi = N;
      while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (len[mid] < target) lo = mid; else hi = mid; }
      var f = (target - len[lo]) / (len[hi] - len[lo] || 1);
      var ax = pts[lo][0], ay = pts[lo][1], bx = pts[hi][0], by = pts[hi][1];
      var tx = bx - ax, ty = by - ay, tl = Math.hypot(tx, ty) || 1;
      tx /= tl; ty /= tl;
      // screen y points down, so (-ty, tx) faces the cytoplasm (inside)
      return { x: ax + (bx - ax) * f, y: ay + (by - ay) * f, tx: tx, ty: ty, nx: -ty, ny: tx, total: total };
    };
  }

  function drawDimer(x, y, angle, r, alpha, shade) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colors.matrix;
    ctx.strokeStyle = colors.matrix;
    ctx.lineWidth = 1.4;
    for (var side = -1; side <= 1; side += 2) {
      ctx.beginPath();
      ctx.ellipse(side * r * 0.92, 0, r, r * 0.68, 0, 0, Math.PI * 2);
      if ((side < 0) === !!shade) {
        ctx.fill();
      } else {
        ctx.globalAlpha = alpha * 0.55;
        ctx.fill();
        ctx.globalAlpha = alpha;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function frame(now) {
    if (start === null) start = now;
    var t = reduceMotion ? 1 : clamp((now - start) / DURATION);

    // bud height follows how many dimers have docked
    var docked = 0;
    for (var i = 0; i < dimers.length; i++) docked += easeOut(clamp((t - dimers[i].t0) / 0.18));
    var bud = easeInOut(docked / dimers.length);
    var at = membrane(bud);

    ctx.clearRect(0, 0, W, H);

    var scale = Math.min(W / 560, 1.25);
    var headR = 2.5 * scale, leaflet = 7 * scale;

    // lipid bilayer
    var total = at(0).total, spacing = 6.2 * scale;
    var nLipid = Math.floor(total / spacing);
    ctx.lineCap = "round";
    for (var j = 0; j <= nLipid; j++) {
      var p = at(j / nLipid);
      for (var side = -1; side <= 1; side += 2) {
        var hx = p.x + p.nx * leaflet * side, hy = p.y + p.ny * leaflet * side;
        ctx.strokeStyle = colors.rule;
        ctx.lineWidth = 1.1 * scale;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(p.x + p.nx * side * 1.2, p.y + p.ny * side * 1.2);
        ctx.stroke();
        ctx.fillStyle = colors.lipid;
        ctx.beginPath();
        ctx.arc(hx, hy, headR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // glycoprotein spikes on the outer surface, late in assembly
    for (var k = 0; k < spikes.length; k++) {
      var sp = spikes[k], a = easeOut(clamp((t - sp.t0) / 0.15));
      if (a <= 0) continue;
      var q = at(sp.u), base = leaflet + headR;
      var len = 22 * scale * a;
      var ex = q.x - q.nx * (base + len), ey = q.y - q.ny * (base + len);
      ctx.globalAlpha = a;
      ctx.strokeStyle = colors.slate;
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(q.x - q.nx * base, q.y - q.ny * base);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.fillStyle = colors.slate;
      ctx.beginPath();
      ctx.arc(ex, ey, 4.2 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // nucleocapsid coil packaged inside the bud
    var nc = easeOut(clamp((t - 0.8) / 0.2));
    if (nc > 0) {
      var top = at(0.5), depth = leaflet + 34 * scale;
      var y1 = top.y + depth, y2 = H * 0.7 + 10 * scale;
      var turns = Math.max(3, Math.floor((y2 - y1) / (16 * scale)));
      ctx.globalAlpha = nc;
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 1.6 * scale;
      ctx.beginPath();
      for (var z = 0; z <= turns * 12; z++) {
        var f = z / (turns * 12);
        var yy = y1 + (y2 - y1) * f;
        var xx = W * 0.5 + Math.sin(f * turns * Math.PI * 2) * 16 * scale;
        if (z) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // unbound dimers that stay in the cytoplasm
    var r = 6.4 * scale;
    for (var m = 0; m < strays.length; m++) drawDimer(strays[m].x, strays[m].y, strays[m].a, r * 0.9, 0.35, m % 2);

    // docking dimers
    for (var d = 0; d < dimers.length; d++) {
      var dm = dimers[d], e = easeInOut(clamp((t - dm.t0) / 0.18));
      var mp = at(dm.u), off = leaflet + headR + r * 0.9;
      var tx = mp.x + mp.nx * off, ty = mp.y + mp.ny * off;
      var ang = Math.atan2(mp.ty, mp.tx);
      var x = dm.sx + (tx - dm.sx) * e, y = dm.sy + (ty - dm.sy) * e;
      var angle = dm.sa + (ang - dm.sa) * e;
      drawDimer(x, y, angle, r, 0.45 + 0.55 * e, dm.shade);
    }

    if (t < 1) requestAnimationFrame(frame);
    else done = true;
  }

  function redraw() {
    setup();
    if (done || reduceMotion) { start = null; reduceMotion = true; requestAnimationFrame(frame); }
  }

  readColors();
  setup();

  // start when the figure is on screen
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { io.disconnect(); requestAnimationFrame(frame); }
    }, { threshold: 0.3 });
    io.observe(canvas);
  } else {
    requestAnimationFrame(frame);
  }

  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { if (canvas.clientWidth !== W) redraw(); }, 150);
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    readColors();
    if (done) redraw();
  });
})();
