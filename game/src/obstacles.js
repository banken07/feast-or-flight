// Feast or Flight — obstacles and pickups.
// The farm throws fences, hay bales, glowing ovens and a swinging carving
// knife at the turkey; corn, golden feathers and pie keep the run alive.
// Every obstacle is drawn from code and carries its own hitbox.
function createObstacleField() {
  return {
    items: [],
    timer: 1.2,
    pieDropped: false,
  };
}

function obstacleKindsForStage(distance) {
  if (distance < CFG.stageKitchen) return ['fence', 'hay', 'branch', 'fence', 'corn'];
  if (distance < CFG.stageForest) return ['oven', 'knife', 'branch', 'fence', 'oven', 'corn'];
  return ['oven', 'knife', 'branch', 'hay', 'oven', 'knife', 'corn'];
}

function spawnObstacleGroup(field, rng, distance, speed) {
  const kind = rng.pick(obstacleKindsForStage(distance));
  const x = CFG.canvasWidth + 80;
  if (kind === 'corn') {
    spawnCornArc(field, x, rng);
    return;
  }
  const item = { kind, x, passed: false };
  if (kind === 'fence') {
    item.w = 46;
    item.h = 62;
  } else if (kind === 'hay') {
    item.w = 74;
    item.h = 66;
  } else if (kind === 'oven') {
    item.w = 96;
    item.h = 118;
    item.flicker = rng.range(0, 10);
  } else if (kind === 'knife') {
    // A kitchen cart with a giant carving knife stuck blade-up in it.
    item.w = 92;
    item.h = 112;
  } else if (kind === 'branch') {
    // A low branch: the turkey must duck under it, not jump.
    item.w = 120;
    item.h = 40;
  }
  field.items.push(item);

  // Sometimes a corn trail follows the obstacle as a reward line.
  if (rng.chance(0.45)) spawnCornArc(field, x + 190, rng);

  // Rare golden feather high above the ground.
  if (distance > 200 && rng.chance(0.12)) {
    field.items.push({ kind: 'feather', x: x + 260, y: CFG.groundY - 220, w: 30, h: 30, passed: false });
  }
  // One pie per run, hidden late in the kitchen yard.
  if (!field.pieDropped && distance > 420 && rng.chance(0.3)) {
    field.pieDropped = true;
    field.items.push({ kind: 'pie', x: x + 320, y: CFG.groundY - 120, w: 40, h: 34, passed: false });
  }
}

function spawnCornArc(field, x, rng) {
  const n = 5;
  for (let i = 0; i < n; i++) {
    field.items.push({
      kind: 'corn',
      x: x + i * 34,
      y: CFG.groundY - 90 - Math.sin((i / (n - 1)) * Math.PI) * 70,
      w: 26,
      h: 26,
      passed: false,
    });
  }
}

function obstacleUpdate(field, dt, speed, distance, rng) {
  field.timer -= dt;
  if (field.timer <= 0) {
    spawnObstacleGroup(field, rng, distance, speed);
    const gapPx = rng.range(CFG.spawnMinGapPx, CFG.spawnMaxGapPx);
    field.timer = gapPx / speed;
  }
  for (const it of field.items) {
    it.x -= speed * dt;
    if (it.kind === 'oven') it.flicker += dt * 9;
  }
  field.items = field.items.filter((it) => it.x > -220);
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// The low branch hangs at standing-head height: a ducking turkey passes
// under it, a standing one does not.
function obstacleHitbox(it) {
  if (it.kind === 'corn' || it.kind === 'feather' || it.kind === 'pie') {
    return { x: it.x, y: it.y, w: it.w, h: it.h };
  }
  if (it.kind === 'branch') {
    return { x: it.x + 4, y: CFG.groundY - 84, w: it.w - 8, h: 38 };
  }
  return { x: it.x + 6, y: CFG.groundY - it.h + 8, w: it.w - 12, h: it.h - 8 };
}

// Returns an array of events: {type:'hit'|'corn'|'feather'|'pie', item}.
function obstacleCollisions(field, turkeyBox) {
  const events = [];
  for (const it of field.items) {
    if (it.passed) continue;
    const box = obstacleHitbox(it);
    if (!box || !rectsOverlap(box, turkeyBox)) continue;
    it.passed = true;
    if (it.kind === 'corn') events.push({ type: 'corn', item: it });
    else if (it.kind === 'feather') events.push({ type: 'feather', item: it });
    else if (it.kind === 'pie') events.push({ type: 'pie', item: it });
    else events.push({ type: 'hit', item: it });
  }
  return events;
}

function obstacleDraw(ctx, field, time) {
  for (const it of field.items) {
    if (it.kind === 'fence') drawFence(ctx, it);
    else if (it.kind === 'hay') drawHay(ctx, it);
    else if (it.kind === 'oven') drawOven(ctx, it, time);
    else if (it.kind === 'knife') drawKnifeCart(ctx, it);
    else if (it.kind === 'branch') drawBranch(ctx, it);
    else if (it.kind === 'corn') drawCorn(ctx, it, time);
    else if (it.kind === 'feather') drawFeather(ctx, it, time);
    else if (it.kind === 'pie') drawPie(ctx, it);
  }
}

function drawFence(ctx, it) {
  const y = CFG.groundY;
  ctx.fillStyle = '#6b4423';
  ctx.fillRect(it.x + 2, y - it.h, 8, it.h);
  ctx.fillRect(it.x + it.w - 10, y - it.h, 8, it.h);
  ctx.fillRect(it.x, y - it.h + 8, it.w, 9);
  ctx.fillRect(it.x, y - it.h + 32, it.w, 9);
  ctx.fillStyle = '#8a5a30';
  ctx.fillRect(it.x, y - it.h + 8, it.w, 3);
}

function drawHay(ctx, it) {
  const y = CFG.groundY;
  ctx.fillStyle = '#d9a441';
  ctx.beginPath();
  ctx.ellipse(it.x + it.w / 2, y - it.h / 2, it.w / 2, it.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a8762a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(it.x + it.w / 2, y - it.h / 2, it.w / 2 - 10, it.h / 2 - 10, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(it.x + it.w / 2, y - it.h / 2, 8, 8, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawOven(ctx, it, time) {
  const y = CFG.groundY;
  const flick = 0.75 + Math.sin(it.flicker) * 0.25;
  // Body.
  ctx.fillStyle = '#3a3a44';
  ctx.beginPath();
  ctx.roundRect(it.x, y - it.h, it.w, it.h, 10);
  ctx.fill();
  ctx.fillStyle = '#2a2a32';
  ctx.fillRect(it.x + 8, y - it.h + 8, it.w - 16, 14);
  // Glowing door with fire.
  const glow = ctx.createRadialGradient(
    it.x + it.w / 2, y - 52, 6,
    it.x + it.w / 2, y - 52, 46,
  );
  glow.addColorStop(0, '#ffd166');
  glow.addColorStop(0.6, `rgba(255, 123, 36, ${flick})`);
  glow.addColorStop(1, 'rgba(255, 123, 36, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(it.x + it.w / 2, y - 52, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff7b24';
  ctx.beginPath();
  ctx.roundRect(it.x + 18, y - 88, it.w - 36, 62, 8);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.moveTo(it.x + 30, y - 30);
  ctx.quadraticCurveTo(it.x + it.w / 2, y - 88 - Math.sin(time * 9) * 8, it.x + it.w - 30, y - 30);
  ctx.closePath();
  ctx.fill();
  // Chimney and heat lines.
  ctx.fillStyle = '#2a2a32';
  ctx.fillRect(it.x + it.w - 28, y - it.h - 22, 16, 24);
  ctx.strokeStyle = `rgba(255, 209, 102, ${0.5 + flick * 0.3})`;
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    const hx = it.x + 16 + i * 14;
    ctx.beginPath();
    ctx.moveTo(hx, y - it.h - 8);
    ctx.quadraticCurveTo(hx + 6, y - it.h - 26, hx, y - it.h - 40);
    ctx.stroke();
  }
}

// A kitchen cart with a giant carving knife stuck blade-up in it —
// the carving knife as a jump-over threat.
function drawKnifeCart(ctx, it) {
  const y = CFG.groundY;
  // Wheels.
  ctx.fillStyle = '#2a2a32';
  ctx.beginPath();
  ctx.arc(it.x + 18, y - 12, 12, 0, Math.PI * 2);
  ctx.arc(it.x + it.w - 18, y - 12, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a8f96';
  ctx.beginPath();
  ctx.arc(it.x + 18, y - 12, 5, 0, Math.PI * 2);
  ctx.arc(it.x + it.w - 18, y - 12, 5, 0, Math.PI * 2);
  ctx.fill();
  // Cart body.
  ctx.fillStyle = '#6b4423';
  ctx.beginPath();
  ctx.roundRect(it.x, y - 46, it.w, 26, 6);
  ctx.fill();
  ctx.fillStyle = '#8a5a30';
  ctx.fillRect(it.x + 4, y - 46, it.w - 8, 6);
  // The giant carving knife, blade up, glinting.
  ctx.fillStyle = '#dfe6ee';
  ctx.beginPath();
  ctx.moveTo(it.x + 30, y - 44);
  ctx.lineTo(it.x + 62, y - 44);
  ctx.lineTo(it.x + 58, y - 104);
  ctx.quadraticCurveTo(it.x + 46, y - 116, it.x + 34, y - 104);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(it.x + 36, y - 100, 4, 52);
  // Handle.
  ctx.fillStyle = '#4a2e16';
  ctx.beginPath();
  ctx.roundRect(it.x + 28, y - 58, 36, 16, 6);
  ctx.fill();
  // Danger glint.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.moveTo(it.x + 52, y - 110);
  ctx.lineTo(it.x + 58, y - 104);
  ctx.lineTo(it.x + 50, y - 100);
  ctx.closePath();
  ctx.fill();
}

// A low branch with autumn leaves: duck under it.
function drawBranch(ctx, it) {
  const y = CFG.groundY - 84;
  ctx.strokeStyle = '#4a2e16';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(it.x - 6, y + 8);
  ctx.lineTo(it.x + it.w + 6, y + 2);
  ctx.stroke();
  ctx.fillStyle = '#c65a1a';
  for (let i = 0; i < 6; i++) {
    const lx = it.x + 10 + i * 19;
    ctx.beginPath();
    ctx.ellipse(lx, y - 4 + (i % 2) * 8, 9, 6, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#e8a33d';
  for (let i = 0; i < 4; i++) {
    const lx = it.x + 20 + i * 26;
    ctx.beginPath();
    ctx.ellipse(lx, y + 12, 7, 5, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCorn(ctx, it, time) {
  const bob = Math.sin(time * 5 + it.x * 0.05) * 3;
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.ellipse(it.x + 13, it.y + 13 + bob, 10, 13, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2b705';
  ctx.fillRect(it.x + 9, it.y + 4 + bob, 3, 18);
  ctx.fillRect(it.x + 14, it.y + 4 + bob, 3, 18);
  ctx.fillStyle = '#4a6b2f';
  ctx.beginPath();
  ctx.moveTo(it.x + 4, it.y + 22 + bob);
  ctx.lineTo(it.x + 13, it.y + 28 + bob);
  ctx.lineTo(it.x + 22, it.y + 22 + bob);
  ctx.closePath();
  ctx.fill();
}

function drawFeather(ctx, it, time) {
  const bob = Math.sin(time * 4 + it.x * 0.03) * 5;
  ctx.save();
  ctx.translate(it.x + 15, it.y + 15 + bob);
  ctx.rotate(Math.sin(time * 2) * 0.3);
  ctx.fillStyle = '#f2c94c';
  ctx.beginPath();
  ctx.ellipse(0, 0, 7, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b8860b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(0, 14);
  ctx.stroke();
  ctx.restore();
}

function drawPie(ctx, it) {
  ctx.fillStyle = '#e8a33d';
  ctx.beginPath();
  ctx.moveTo(it.x, it.y + it.h);
  ctx.lineTo(it.x, it.y + 10);
  ctx.lineTo(it.x + it.w, it.y + 10);
  ctx.lineTo(it.x + it.w, it.y + it.h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#a83226';
  ctx.fillRect(it.x + 2, it.y + 10, it.w - 4, 6);
  ctx.fillStyle = '#fff3d6';
  ctx.beginPath();
  ctx.arc(it.x + it.w / 2, it.y + 8, 7, 0, Math.PI * 2);
  ctx.fill();
}
