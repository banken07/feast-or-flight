// Feast or Flight — the sunset farm world.
// Parallax layers: sky, sun, clouds, hills, farmhouse, barn, trees, then
// the dirt path the turkey runs on, with drifting autumn leaves.
//
// GROUNDING (v10): the far-hill crest is 500 - sin(...)*34, so it ranges
// y 466-534 as the run scrolls. The farmhouse used to sit at baseY 470
// and the barn at 500 — both ABOVE the crest at most scroll phases,
// leaving up to ~48px of bright sky under the building, so the house
// read as floating (Ban caught it). Both bases now sit BELOW the
// deepest possible crest (534) with a contact shadow, so the buildings
// are sunk into the hillside at every scroll phase and can never float.

// Stage palettes: the run's three places share the sunset family but
// read differently — farmyard (baseline), kitchen yard (warmer, deeper
// red, kitchen smoke), forest edge (darker, greener, denser trees).
// Colours blend over 60m around each boundary so the change never pops.
const STAGE_PALETTES = [
  { skyTop: '#2b1b4a', skyMid: '#7a2d5e', skyLow: '#e85d3d', horizon: '#f9a03f', hillFar: '#4a2a5e', hillNear: '#3a2048' },
  { skyTop: '#3a1230', skyMid: '#8f2f42', skyLow: '#f06428', horizon: '#ffb347', hillFar: '#5a2438', hillNear: '#42203a' },
  { skyTop: '#1a1238', skyMid: '#5e2a55', skyLow: '#c65a3a', horizon: '#e8893f', hillFar: '#2a2a44', hillNear: '#1e3a1e' },
];

function hexLerp(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

// Which palette pair the distance sits in, and how far the blend has
// gone (t 0→1 across a 60m window centred on each stage boundary).
function stageMix(distance) {
  const K = CFG.stageKitchen;
  const F = CFG.stageForest;
  const W = 60;
  if (distance < K - W / 2) return { from: 0, to: 0, t: 0 };
  if (distance < K + W / 2) return { from: 0, to: 1, t: (distance - (K - W / 2)) / W };
  if (distance < F - W / 2) return { from: 1, to: 1, t: 0 };
  if (distance < F + W / 2) return { from: 1, to: 2, t: (distance - (F - W / 2)) / W };
  return { from: 2, to: 2, t: 0 };
}
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
  // Stage identity: the HUD already names the stages, but stages 1 and
  // 2 used to look identical. Now the whole scene shifts with the run —
  // sky, hills and trees lerp between the three stage palettes, the
  // kitchen yard grows chimney smoke, and the forest edge grows denser,
  // taller, greener trees. Purely visual: distance only drives colours.
  const mix = stageMix(distance);
  const pal = {};
  for (const k of ['skyTop', 'skyMid', 'skyLow', 'horizon', 'hillFar', 'hillNear']) {
    pal[k] = hexLerp(STAGE_PALETTES[mix.from][k], STAGE_PALETTES[mix.to][k], mix.t);
  }
  // kitchenness is 1 inside the kitchen yard and ramps at both edges;
  // forestness is 0 before the forest and 1 inside it.
  const kitchenness =
    mix.from === 1 && mix.to === 1 ? 1 : mix.to === 1 ? mix.t : mix.from === 1 ? 1 - mix.t : 0;
  const forestness = mix.to === 2 ? mix.t : mix.from === 2 ? 1 : 0;

  // Sunset sky.
  const sky = ctx.createLinearGradient(0, 0, 0, CFG.groundY);
  sky.addColorStop(0, pal.skyTop);
  sky.addColorStop(0.45, pal.skyMid);
  sky.addColorStop(0.8, pal.skyLow);
  sky.addColorStop(1, pal.horizon);
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

  // Distant birds crossing the upper sky — a little life in the open
  // upper-right of the cover, small dark strokes that read as birds
  // without cluttering the frame.
  ctx.strokeStyle = 'rgba(43, 27, 74, 0.8)';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const bx = (((1180 + i * 62 - world.scroll * 0.05) % 1400) + 1400) % 1400 - 60;
    const by = 128 + (i % 3) * 30 + Math.sin(time * 0.8 + i) * 4;
    ctx.beginPath();
    ctx.moveTo(bx - 8, by + 3);
    ctx.lineTo(bx, by - 3);
    ctx.lineTo(bx + 8, by + 3);
    ctx.stroke();
  }

  // Far hills.
  ctx.fillStyle = pal.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, 520);
  for (let x = 0; x <= CFG.canvasWidth; x += 80) {
    ctx.lineTo(x, 500 - Math.sin((x + world.scroll * 0.15) * 0.004) * 34);
  }
  ctx.lineTo(CFG.canvasWidth, CFG.groundY);
  ctx.lineTo(0, CFG.groundY);
  ctx.closePath();
  ctx.fill();

  // Farmhouse and barn silhouettes (parallax 0.35). Bases sit below the
  // deepest hill crest (534) so they are always sunk into the hillside.
  const farmX = 180 - ((world.scroll * 0.35) % 1500);
  drawFarmhouse(ctx, farmX, 545);
  drawFarmhouse(ctx, farmX + 760, 545);
  drawBarn(ctx, farmX + 420, 555);

  // Kitchen-yard smoke: in stage 2 the ovens are cooking, so the
  // farmhouse chimneys breathe harder — extra puffs rising above the
  // houses, fading in and out with the stage blend.
  if (kitchenness > 0.03) {
    ctx.fillStyle = `rgba(230, 220, 240, ${0.28 * kitchenness})`;
    for (const cx of [farmX + 118, farmX + 878]) {
      for (let i = 0; i < 3; i++) {
        const rise = (time * 12 + i * 45) % 135;
        const px = cx + Math.sin(time + i * 2) * 6;
        const py = 545 - 150 - rise;
        ctx.beginPath();
        ctx.arc(px, py, 8 + i * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Trees (parallax 0.6). In the forest edge they grow denser, taller
  // and greener: the colour lerps purple → dark green with the stage
  // blend, the height scales up, and a second row of trees fades in.
  ctx.fillStyle = pal.hillNear;
  const treeHScale = 1 + 0.35 * forestness;
  for (const tree of world.trees) {
    const tx = ((tree.x - world.scroll * 0.6) % 1600 + 1600) % 1600 - 80;
    const th = tree.h * treeHScale;
    ctx.beginPath();
    ctx.ellipse(tx, CFG.groundY - th, 27, th, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(tx - 5, CFG.groundY - 46, 10, 46);
  }
  if (forestness > 0.03) {
    ctx.save();
    ctx.globalAlpha = forestness * 0.9;
    for (const tree of world.trees) {
      const tx = ((tree.x + 85 - world.scroll * 0.6) % 1600 + 1600) % 1600 - 80;
      const th = tree.h * 0.8 * treeHScale;
      ctx.beginPath();
      ctx.ellipse(tx, CFG.groundY - th, 22, th, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(tx - 4, CFG.groundY - 40, 8, 40);
    }
    ctx.restore();
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
  // Contact shadow: a dark smudge on the hillside under the base, so the
  // building reads as sitting on the hill even where hill and house
  // colours are close (stage 3).
  ctx.fillStyle = 'rgba(20, 8, 20, 0.3)';
  ctx.beginPath();
  ctx.ellipse(x + 75, baseY + 2, 88, 8, 0, 0, Math.PI * 2);
  ctx.fill();
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
  // Contact shadow under the base, same reason as the farmhouse.
  ctx.fillStyle = 'rgba(20, 8, 20, 0.3)';
  ctx.beginPath();
  ctx.ellipse(x + 60, baseY + 2, 72, 7, 0, 0, Math.PI * 2);
  ctx.fill();
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
  // Golden light beyond the gate. v7: the glow was so hot (0.95) it
  // bleached the turkey's tail where the bird stands in it — 0.7 with a
  // slightly smaller radius lets the dark green trees show through, so
  // the orange tail keeps its contrast against the gate.
  const glow = ctx.createRadialGradient(x, CFG.groundY - 90, 10, x, CFG.groundY - 90, 115);
  glow.addColorStop(0, 'rgba(255, 209, 102, 0.7)');
  glow.addColorStop(1, 'rgba(255, 209, 102, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, CFG.groundY - 90, 115, 0, Math.PI * 2);
  ctx.fill();
  // Banner: a bright cream panel with dark green text and a dark outline,
  // so the label reads at thumbnail size even under the end-screen dim.
  ctx.fillStyle = '#fff3d6';
  ctx.beginPath();
  ctx.roundRect(x - 100, CFG.groundY - 256, 200, 46, 8);
  ctx.fill();
  ctx.strokeStyle = '#1e3a1e';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#1e3a1e';
  ctx.font = 'bold 25px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FOREST GATE', x, CFG.groundY - 224);
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
