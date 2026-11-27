// Feast or Flight — the turkey: the player.
// A big brown bird with a fanned tail, drawn entirely from canvas shapes.
// It runs in place while the world scrolls; it jumps, ducks, and flaps.
function createTurkey() {
  return {
    x: CFG.turkeyX,
    y: CFG.groundY - CFG.turkeyHeight,
    vy: 0,
    grounded: true,
    ducking: false,
    wantDuck: false,
    jumpBuffer: 0,
    runPhase: 0,
    invulnT: 0,
    flapT: 0,
  };
}

function turkeyJump(t) {
  if (t.grounded) {
    t.vy = -CFG.jumpVelocity;
    t.grounded = false;
    t.ducking = false;
    t.jumpBuffer = 0;
    t.flapT = 0.28;
    AudioSys.jump();
  } else {
    // Jump pressed just before landing: remember it briefly so the
    // turkey jumps the moment its feet touch the ground.
    t.jumpBuffer = 0.12;
  }
}

function turkeyDuck(t, on) {
  t.wantDuck = on;
}

function turkeyUpdate(t, dt) {
  t.runPhase += dt * (t.grounded ? 11 : 4);
  if (t.invulnT > 0) t.invulnT -= dt;
  if (t.flapT > 0) t.flapT -= dt;
  if (t.jumpBuffer > 0) t.jumpBuffer -= dt;
  t.ducking = t.wantDuck && t.grounded;
  if (!t.grounded) {
    t.vy += CFG.gravity * dt;
    t.y += t.vy * dt;
    const floor = CFG.groundY - turkeyHeightNow(t);
    if (t.y >= floor) {
      t.y = floor;
      t.vy = 0;
      t.grounded = true;
      if (t.jumpBuffer > 0) turkeyJump(t);
    }
  }
}

function turkeyHeightNow(t) {
  return t.ducking && t.grounded ? CFG.turkeyDuckHeight : CFG.turkeyHeight;
}

// Collision box: tighter than the drawing so near-misses feel fair.
function turkeyBounds(t) {
  const h = turkeyHeightNow(t);
  return {
    x: t.x + 14,
    y: t.y + (CFG.turkeyHeight - h) + 8,
    w: CFG.turkeyWidth - 30,
    h: h - 12,
  };
}

function turkeyDraw(ctx, t, time) {
  const blink = t.invulnT > 0 && Math.floor(time * 14) % 2 === 0;
  if (blink) return; // invulnerability flicker
  const x = t.x;
  const y = t.y + (CFG.turkeyHeight - turkeyHeightNow(t));
  const h = turkeyHeightNow(t);
  const legSwing = t.grounded ? Math.sin(t.runPhase) * 10 : 6;
  const flap = t.flapT > 0 ? Math.sin(t.flapT * 30) * 0.5 : 0;

  ctx.save();
  ctx.translate(x, y);

  // Fanned tail feathers.
  const tailColors = ['#b5541e', '#d97b29', '#8a3b12', '#e8a33d', '#c65a1a'];
  for (let i = 0; i < 5; i++) {
    const a = -0.9 + i * 0.45;
    ctx.save();
    ctx.translate(16, 26);
    ctx.rotate(a);
    ctx.fillStyle = tailColors[i];
    ctx.beginPath();
    ctx.ellipse(0, -26, 9, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2d492';
    ctx.beginPath();
    ctx.ellipse(0, -40, 4, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Legs.
  ctx.strokeStyle = '#e8862e';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(44, h - 16);
  ctx.lineTo(44 + legSwing, CFG.turkeyHeight);
  ctx.moveTo(58, h - 16);
  ctx.lineTo(58 - legSwing, CFG.turkeyHeight);
  ctx.stroke();

  // Body.
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.ellipse(50, h - 30, 34, 26, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a06a35';
  ctx.beginPath();
  ctx.ellipse(56, h - 36, 22, 16, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Wing (flaps on jump).
  ctx.save();
  ctx.translate(48, h - 34);
  ctx.rotate(-0.5 - flap);
  ctx.fillStyle = '#6e4520';
  ctx.beginPath();
  ctx.ellipse(-6, 0, 20, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Neck and head.
  ctx.fillStyle = '#7a4a22';
  ctx.beginPath();
  ctx.ellipse(78, h - 58, 9, 18, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(82, h - 76, 13, 0, Math.PI * 2);
  ctx.fill();
  // Beak.
  ctx.fillStyle = '#f2a541';
  ctx.beginPath();
  ctx.moveTo(90, h - 80);
  ctx.lineTo(104, h - 74);
  ctx.lineTo(90, h - 70);
  ctx.closePath();
  ctx.fill();
  // Wattle.
  ctx.fillStyle = '#d92632';
  ctx.beginPath();
  ctx.ellipse(88, h - 64, 4, 8, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Eye.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(85, h - 80, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(86, h - 80, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
