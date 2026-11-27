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
    // v15: the gap is a time (spawnMinGapSec..spawnMaxGapSec), so the
    // px spacing grows with speed and the landing margin stays constant.
    field.timer = rng.range(CFG.spawnMinGapSec, CFG.spawnMaxGapSec);
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
    // A collected pickup vanishes the instant the turkey touches it —
    // before this fix it kept scrolling along "stuck" in place, because
    // draw ran over every item and only the off-screen filter removed it.
    // (Hit obstacles keep drawing after a hit: only pickups vanish.)
    if (it.passed && (it.kind === 'corn' || it.kind === 'feather' || it.kind === 'pie')) continue;
    if (it.kind === 'fence') drawFence(ctx, it);
    else if (it.kind === 'hay') drawHay(ctx, it);
    else if (it.kind === 'oven') drawOven(ctx, it, time);
    else if (it.kind === 'knife') drawKnifeCart(ctx, it);
    else if (it.kind === 'branch') drawBranch(ctx, it, time);
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
  // Cart body: warm brown with a light rim, so the cart reads as a solid
  // shape against the dark ground instead of vanishing into it.
  ctx.fillStyle = '#7d4f27';
  ctx.beginPath();
  ctx.roundRect(it.x, y - 46, it.w, 26, 6);
  ctx.fill();
  ctx.strokeStyle = '#c98d4e';
  ctx.lineWidth = 2;
  ctx.stroke();
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

// A low branch with autumn leaves: duck under it. Redrawn v13 to read as
// a real TREE at a glance — a gnarled, tapered limb with bark, a forked
// twig, and a two-layer leaf canopy — not a floating stick with a row of
// blobs. Geometry budget (measured, do not break): hitbox is
// groundY-84..groundY-46 (y 516..554); the ducked turkey's head top is at
// y 554, so NOTHING may hang below y ~548. Leaves stay bright greens
// only — never orange — so at thumbnail size the canopy never merges
// with the turkey's orange tail feathers into one blob.
function drawBranch(ctx, it, time) {
  const y = CFG.groundY - 84;
  const x = it.x;
  const w = it.w;
  // Gentle canopy sway, deterministic (game time only, no random).
  const sway = Math.sin(time * 1.6 + x * 0.02) * 1.5;

  // --- Back canopy layer: darker greens, bigger bumpy cloud. ---
  // Hand-placed (identical for every branch, like the fence) so the shape
  // never shimmers as the item scrolls.
  const backLeaves = [
    // [dx, dy, rx, ry, rot]
    [6, -26, 15, 10, 0.3], [26, -32, 16, 11, -0.2], [48, -28, 15, 10, 0.4],
    [70, -33, 16, 11, -0.3], [92, -28, 15, 10, 0.2], [110, -24, 13, 9, -0.4],
    [16, -16, 13, 9, -0.3], [58, -18, 14, 9, 0.3], [100, -15, 12, 8, 0.2],
  ];
  const backColors = ['#2e7d32', '#388e3c', '#43a047'];
  for (let i = 0; i < backLeaves.length; i++) {
    const L = backLeaves[i];
    ctx.fillStyle = backColors[i % backColors.length];
    ctx.beginPath();
    ctx.ellipse(x + L[0] + sway, y + L[1], L[2], L[3], L[4], 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Forked twig rising from the middle of the limb. ---
  ctx.strokeStyle = '#5a3a1e';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.55, y + 2);
  ctx.quadraticCurveTo(x + w * 0.68, y - 14, x + w * 0.8, y - 26 + sway);
  ctx.stroke();
  // Small leaf cluster at the twig tip.
  ctx.fillStyle = '#7ed957';
  ctx.beginPath();
  ctx.ellipse(x + w * 0.8 + sway, y - 30, 10, 7, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#58c24a';
  ctx.beginPath();
  ctx.ellipse(x + w * 0.8 - 8 + sway, y - 25, 8, 6, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // --- Main limb: tapered, gently S-curved, with bark. ---
  // Thick at the left (cut end, where it joins the off-screen trunk),
  // tapering to a point at the right tip.
  ctx.fillStyle = '#4a2e16';
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 2);
  ctx.quadraticCurveTo(x + w * 0.35, y - 8, x + w * 0.62, y - 2);
  ctx.quadraticCurveTo(x + w * 0.85, y + 2, x + w + 10, y - 2);
  ctx.quadraticCurveTo(x + w * 0.85, y + 8, x + w * 0.6, y + 8);
  ctx.quadraticCurveTo(x + w * 0.3, y + 12, x - 10, y + 12);
  ctx.closePath();
  ctx.fill();
  // Bark: two dark grain lines following the limb's curve.
  ctx.strokeStyle = '#33200e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 6, y + 2);
  ctx.quadraticCurveTo(x + w * 0.4, y - 2, x + w * 0.9, y + 1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 4, y + 8);
  ctx.quadraticCurveTo(x + w * 0.45, y + 5, x + w * 0.85, y + 6);
  ctx.stroke();
  // Bark highlight along the top edge (sunlit side).
  ctx.strokeStyle = '#7a5230';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 1);
  ctx.quadraticCurveTo(x + w * 0.4, y - 6, x + w * 0.8, y - 1);
  ctx.stroke();
  // Cut end at the left: darker cap so the limb reads as sawn off a
  // trunk just off-screen, not floating.
  ctx.fillStyle = '#33200e';
  ctx.beginPath();
  ctx.ellipse(x - 9, y + 5, 4, 8, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // --- Front canopy layer: bright greens, overlapping the limb top. ---
  const frontLeaves = [
    // [dx, dy, rx, ry, rot]
    [2, -14, 12, 8, 0.4], [20, -20, 13, 9, -0.3], [38, -14, 11, 8, 0.5],
    [56, -22, 14, 9, -0.2], [76, -15, 12, 8, 0.3], [94, -21, 13, 9, -0.4],
    [112, -13, 11, 7, 0.2], [30, -8, 10, 7, -0.5], [84, -8, 10, 7, 0.4],
  ];
  const frontColors = ['#58c24a', '#7ed957', '#4caf50', '#8bc34a', '#66bb6a'];
  for (let i = 0; i < frontLeaves.length; i++) {
    const L = frontLeaves[i];
    ctx.fillStyle = frontColors[i % frontColors.length];
    ctx.beginPath();
    ctx.ellipse(x + L[0] + sway, y + L[1], L[2], L[3], L[4], 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Hanging twigs below the limb: the underside edge a ducking
  // turkey slips under. Kept SHORT: leaf bottoms stop at y + 29 (y 545),
  // ~9px above the ducked turkey's head top (y 554), so the ducked head
  // stays visibly clear of the leaves.
  const hangX = [22, 58, 92];
  for (let i = 0; i < hangX.length; i++) {
    const hx = x + hangX[i];
    ctx.strokeStyle = '#4a2e16';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(hx, y + 10);
    ctx.lineTo(hx, y + 20);
    ctx.stroke();
    ctx.fillStyle = frontColors[(i + 2) % frontColors.length];
    ctx.beginPath();
    ctx.ellipse(hx, y + 24, 8, 5, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCorn(ctx, it, time) {
  const bob = Math.sin(time * 5 + it.x * 0.05) * 3;
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.ellipse(it.x + 13, it.y + 13 + bob, 10, 13, 0.2, 0, Math.PI * 2);
  ctx.fill();
  // Dark rim so the cob pops against dark tree silhouettes.
  ctx.strokeStyle = '#8a5a00';
  ctx.lineWidth = 2;
  ctx.stroke();
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
