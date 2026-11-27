// Feast or Flight — the farmer: the chaser.
// He runs in from the left, pitchfork in hand. His distance behind the
// turkey is the run's real timer: every stumble lets him close in.
function createFarmer() {
  return {
    runPhase: 0,
    shoutT: 0,
  };
}

function farmerDraw(ctx, turkeyX, gap, time) {
  // Never let the figure be cut at the left edge: when the gap is at its
  // widest (run start, or the escaped end screen) he would otherwise show
  // as a stray sliver of hat and pitchfork. Clamped well inside the
  // frame, so on the end screen he stands clear of the edge entirely.
  const x = Math.max(56, turkeyX - gap - 70);
  const y = CFG.groundY;
  const legSwing = Math.sin(time * 11) * 12;
  const bob = Math.abs(Math.sin(time * 11)) * 3;

  ctx.save();
  ctx.translate(x, y - bob);

  // Legs (overalls).
  ctx.strokeStyle = '#2e4a72';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-6, -52);
  ctx.lineTo(-6 + legSwing, 0);
  ctx.moveTo(8, -52);
  ctx.lineTo(8 - legSwing, 0);
  ctx.stroke();
  // Boots.
  ctx.fillStyle = '#4a2e16';
  ctx.fillRect(-14 + legSwing, -8, 18, 8);
  ctx.fillRect(0 - legSwing, -8, 18, 8);

  // Torso: plaid shirt + overalls.
  ctx.fillStyle = '#a83226';
  ctx.fillRect(-16, -96, 34, 46);
  ctx.fillStyle = '#7a1f16';
  ctx.fillRect(-16, -80, 34, 5);
  ctx.fillRect(-16, -66, 34, 5);
  ctx.fillStyle = '#3a5a8a';
  ctx.fillRect(-14, -96, 30, 30);
  ctx.fillStyle = '#d9b64a';
  ctx.fillRect(-8, -92, 5, 5);
  ctx.fillRect(9, -92, 5, 5);

  // Arm reaching forward, holding the pitchfork.
  ctx.strokeStyle = '#e8b48a';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(14, -88);
  ctx.lineTo(34, -70);
  ctx.stroke();

  // Pitchfork.
  ctx.strokeStyle = '#6b4423';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(34, -70);
  ctx.lineTo(58, -118);
  ctx.stroke();
  ctx.strokeStyle = '#cfd6de';
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(58 + i * 6, -118);
    ctx.lineTo(64 + i * 7, -136);
    ctx.stroke();
  }

  // Head, beard, straw hat.
  ctx.fillStyle = '#e8b48a';
  ctx.beginPath();
  ctx.arc(2, -108, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8e0cc';
  ctx.beginPath();
  ctx.ellipse(4, -98, 10, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9b64a';
  ctx.beginPath();
  ctx.ellipse(2, -118, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-10, -134, 24, 16);
  ctx.fillStyle = '#a83226';
  ctx.fillRect(-10, -122, 24, 4);

  ctx.restore();

  // Shout bubble when he is dangerously close.
  if (gap < CFG.gapDanger) {
    ctx.save();
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#7a1f16';
    ctx.lineWidth = 4;
    const label = 'HEY! COME BACK HERE!';
    const w = ctx.measureText(label).width + 20;
    const bx = Math.max(8, x - w / 2);
    // High under the HUD, not above the farmer's head: the 1.9x bird's
    // tail reaches y ~223 even mid-jump, so a bubble at head height
    // would hide behind it. Up here it clears the bird in every phase.
    const by = 150;
    ctx.beginPath();
    ctx.roundRect(bx, by, w, 32, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7a1f16';
    ctx.fillText(label, bx + w / 2, by + 22);
    ctx.restore();
  }
}
