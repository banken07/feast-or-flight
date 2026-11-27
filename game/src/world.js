// Feast or Flight — the sunset farm world.
// Parallax layers: sky, sun, clouds, hills, farmhouse, barn, trees, then
// the dirt path the turkey runs on, with drifting autumn leaves.
function createWorld(rng) {
  const leaves = [];
  for (let i = 0; i < 26; i++) {
    leaves.push({
      x: rng.range(0, CFG.canvasWidth),
      y: rng.range(0, 520),
      s: rng.range(3, 8),
      v: rng.range(14, 42),
      sway: rng.range(0, Math.PI * 2),
      color: rng.pick(['#e8a33d', '#d97b29', '#c65a1a', '#f2d492']),
    });
  }
  const trees = [];
  for (let i = 0; i < 9; i++) {
    trees.push({ x: i * 170 + rng.range(-40, 40), h: rng.range(80, 140) });
  }
  return { leaves, trees, scroll: 0 };
}

function worldUpdate(world, dt, speed) {
  world.scroll += speed * dt;
  for (const leaf of world.leaves) {
    leaf.x -= (speed * 0.25 + leaf.v) * dt;
    leaf.y += leaf.v * 0.4 * dt;
    leaf.sway += dt * 2;
    if (leaf.x < -12) {
      leaf.x = CFG.canvasWidth + 10;
      leaf.y = Math.random() * 420;
    }
    if (leaf.y > 560) leaf.y = 10;
  }
}

function worldDraw(ctx, world, distance, time) {
  // Sunset sky.
  const sky = ctx.createLinearGradient(0, 0, 0, CFG.groundY);
  sky.addColorStop(0, CFG.skyTop);
  sky.addColorStop(0.45, CFG.skyMid);
  sky.addColorStop(0.8, CFG.skyLow);
  sky.addColorStop(1, CFG.horizon);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CFG.canvasWidth, CFG.groundY + 2);

  // Low sun with glow.
  const sunX = 980;
  const sunY = 470;
  const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 190);
  glow.addColorStop(0, 'rgba(255, 209, 102, 0.9)');
  glow.addColorStop(1, 'rgba(255, 209, 102, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 190, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = CFG.sunColor;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 52, 0, Math.PI * 2);
  ctx.fill();

  // Clouds.
  ctx.fillStyle = 'rgba(122, 45, 94, 0.55)';
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 360 - world.scroll * 0.08) % 1400 + 1400) % 1400 - 60;
    ctx.beginPath();
    ctx.ellipse(cx, 110 + i * 42, 110, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 60, 122 + i * 42, 80, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Far hills.
  ctx.fillStyle = CFG.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, 520);
  for (let x = 0; x <= CFG.canvasWidth; x += 80) {
    ctx.lineTo(x, 500 - Math.sin((x + world.scroll * 0.15) * 0.004) * 34);
  }
  ctx.lineTo(CFG.canvasWidth, CFG.groundY);
  ctx.lineTo(0, CFG.groundY);
  ctx.closePath();
  ctx.fill();

  // Farmhouse and barn silhouettes (parallax 0.35).
  const farmX = 180 - ((world.scroll * 0.35) % 1500);
  drawFarmhouse(ctx, farmX, 470);
  drawFarmhouse(ctx, farmX + 760, 470);
  drawBarn(ctx, farmX + 420, 500);

  // Trees (parallax 0.6).
  ctx.fillStyle = CFG.hillNear;
  for (const tree of world.trees) {
    const tx = ((tree.x - world.scroll * 0.6) % 1600 + 1600) % 1600 - 80;
    ctx.beginPath();
    ctx.ellipse(tx, CFG.groundY - tree.h, 27, tree.h, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(tx - 5, CFG.groundY - 46, 10, 46);
  }

  // Ground.
  ctx.fillStyle = CFG.groundFill;
  ctx.fillRect(0, CFG.groundY, CFG.canvasWidth, CFG.canvasHeight - CFG.groundY);
  ctx.fillStyle = CFG.groundTop;
  ctx.fillRect(0, CFG.groundY, CFG.canvasWidth, 14);
  ctx.fillStyle = CFG.grassColor;
  for (let x = 0; x < CFG.canvasWidth; x += 46) {
    const gx = x - (world.scroll % 46);
    ctx.beginPath();
    ctx.moveTo(gx, CFG.groundY);
    ctx.lineTo(gx + 6, CFG.groundY - 12);
    ctx.lineTo(gx + 12, CFG.groundY);
    ctx.fill();
  }
  // Dirt path dashes.
  ctx.fillStyle = 'rgba(255, 209, 102, 0.25)';
  for (let x = 0; x < CFG.canvasWidth; x += 120) {
    const dx = x - (world.scroll % 120);
    ctx.fillRect(dx, CFG.groundY + 56, 54, 6);
  }

  // Drifting leaves.
  for (const leaf of world.leaves) {
    ctx.save();
    ctx.translate(leaf.x + Math.sin(leaf.sway) * 8, leaf.y);
    ctx.rotate(leaf.sway * 0.5);
    ctx.fillStyle = leaf.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, leaf.s, leaf.s * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // The forest gate at the finish: two great trees and a lit arch. It
  // slides in from the right as the run closes and stands at the turkey
  // when the distance is reached.
  if (distance > CFG.finishDistance - 260) {
    const gateX = CFG.turkeyX + (CFG.finishDistance - distance) * 8;
    drawForestGate(ctx, gateX, time);
  }
}

function drawFarmhouse(ctx, x, baseY) {
  ctx.fillStyle = '#2e1a3a';
  ctx.fillRect(x, baseY - 90, 150, 90);
  ctx.beginPath();
  ctx.moveTo(x - 12, baseY - 90);
  ctx.lineTo(x + 75, baseY - 140);
  ctx.lineTo(x + 162, baseY - 90);
  ctx.closePath();
  ctx.fill();
  // Lit windows.
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(x + 20, baseY - 66, 22, 26);
  ctx.fillRect(x + 60, baseY - 66, 22, 26);
  ctx.fillRect(x + 100, baseY - 66, 22, 26);
  // Chimney smoke.
  ctx.fillStyle = 'rgba(230, 220, 240, 0.35)';
  ctx.beginPath();
  ctx.arc(x + 118, baseY - 150, 10, 0, Math.PI * 2);
  ctx.arc(x + 126, baseY - 168, 13, 0, Math.PI * 2);
  ctx.fill();
}

function drawBarn(ctx, x, baseY) {
  ctx.fillStyle = '#4a1f1a';
  ctx.fillRect(x, baseY - 70, 120, 70);
  ctx.beginPath();
  ctx.moveTo(x, baseY - 70);
  ctx.quadraticCurveTo(x + 60, baseY - 120, x + 120, baseY - 70);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#e8dcc0';
  ctx.lineWidth = 4;
  ctx.strokeRect(x + 42, baseY - 52, 36, 52);
  ctx.beginPath();
  ctx.moveTo(x + 42, baseY - 52);
  ctx.lineTo(x + 78, baseY);
  ctx.moveTo(x + 78, baseY - 52);
  ctx.lineTo(x + 42, baseY);
  ctx.stroke();
}

function drawForestGate(ctx, x, time) {
  // Two great trees.
  ctx.fillStyle = '#1e3a1e';
  ctx.beginPath();
  ctx.ellipse(x - 60, CFG.groundY - 190, 60, 190, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 60, CFG.groundY - 190, 60, 190, 0, 0, Math.PI * 2);
  ctx.fill();
  // Golden light beyond the gate.
  const glow = ctx.createRadialGradient(x, CFG.groundY - 90, 10, x, CFG.groundY - 90, 130);
  glow.addColorStop(0, 'rgba(255, 209, 102, 0.95)');
  glow.addColorStop(1, 'rgba(255, 209, 102, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, CFG.groundY - 90, 130, 0, Math.PI * 2);
  ctx.fill();
  // Banner.
  ctx.fillStyle = '#2e5a2e';
  ctx.beginPath();
  ctx.roundRect(x - 90, CFG.groundY - 250, 180, 40, 8);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FOREST GATE', x, CFG.groundY - 223);
  // Fireflies.
  ctx.fillStyle = '#fff3a0';
  for (let i = 0; i < 8; i++) {
    const fx = x + Math.sin(time * 1.3 + i * 1.7) * 70;
    const fy = CFG.groundY - 120 + Math.cos(time + i * 2.1) * 46;
    ctx.beginPath();
    ctx.arc(fx, fy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
