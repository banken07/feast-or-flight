// Feast or Flight — everything the player reads: the HUD, the title
// screen, the caught/escaped end screens and the pause overlay.
// All text is drawn in the canvas so the screenshots carry it exactly.
function hudDraw(ctx, game) {
  const w = CFG.canvasWidth;
  // Top bar.
  ctx.fillStyle = 'rgba(26, 12, 32, 0.62)';
  ctx.beginPath();
  ctx.roundRect(0, 0, w, 64, 0);
  ctx.fill();

  // Score, left.
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText('SCORE ' + String(game.score).padStart(5, '0'), 22, 40);

  // Distance + progress bar, center. The stage name rides on the same
  // line, so the run reads as three places (farmyard, kitchen yard,
  // forest edge) instead of one endless field.
  const barX = 430;
  const barW = 420;
  const frac = Math.min(1, game.distance / CFG.finishDistance);
  const stageName =
    game.distance < CFG.stageKitchen
      ? 'STAGE 1 · FARMYARD'
      : game.distance < CFG.stageForest
        ? 'STAGE 2 · KITCHEN YARD'
        : 'STAGE 3 · FOREST EDGE';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    'DISTANCE ' + Math.floor(game.distance) + 'm / ' + CFG.finishDistance + 'm · ' + stageName,
    barX + barW / 2, 26,
  );
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.roundRect(barX, 36, barW, 14, 7);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.roundRect(barX, 36, barW * frac, 14, 7);
  ctx.fill();
  // Turkey marker on the bar.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(barX + barW * frac, 43, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a5a2b';
  ctx.beginPath();
  ctx.arc(barX + barW * frac, 43, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('FARM', barX + 20, 62);
  ctx.fillText('FOREST', barX + barW - 24, 62);

  // Lives as feathers, right.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('LIVES', w - 130, 26);
  for (let i = 0; i < CFG.livesStart; i++) {
    const fx = w - 108 + i * 34;
    const fy = 44;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(-0.4);
    ctx.fillStyle = i < game.lives ? '#f2c94c' : 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 6, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Farmer gap meter, bottom left: the farmer icon closes on the turkey.
  const meterX = 22;
  const meterY = CFG.canvasHeight - 52;
  const meterW = 260;
  ctx.fillStyle = 'rgba(26, 12, 32, 0.78)';
  ctx.beginPath();
  ctx.roundRect(meterX - 10, meterY - 26, meterW + 20, 44, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#ff8a7a';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('FARMER JOE', meterX, meterY - 6);
  const gapFrac = Math.max(0, Math.min(1, game.gap / CFG.gapMax));
  const trackY = meterY + 6;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillRect(meterX, trackY, meterW, 8);
  ctx.fillStyle = gapFrac > 0.28 ? '#7ddb6a' : '#ff6b5e';
  ctx.fillRect(meterX, trackY, meterW * gapFrac, 8);
  // Farmer dot and turkey dot.
  ctx.fillStyle = '#a83226';
  ctx.beginPath();
  ctx.arc(meterX + 8, trackY + 4, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(meterX + 8 + meterW * gapFrac, trackY + 4, 8, 0, Math.PI * 2);
  ctx.fill();

  // Danger vignette when the farmer is close.
  if (game.gap < CFG.gapDanger && (game.state === 'playing' || game.state === 'paused')) {
    const pulse = 0.16 + 0.1 * Math.sin(game.time * 8);
    const vg = ctx.createRadialGradient(
      CFG.canvasWidth / 2, CFG.canvasHeight / 2, 300,
      CFG.canvasWidth / 2, CFG.canvasHeight / 2, 720,
    );
    vg.addColorStop(0, 'rgba(180, 20, 20, 0)');
    vg.addColorStop(1, `rgba(180, 20, 20, ${pulse})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, CFG.canvasWidth, CFG.canvasHeight);
  }

  // Big dramatic banner when the farmer is almost on the turkey — the
  // labelled moment the field's strong entries have ("SPOTTED!",
  // "PARDON ME!") and we lacked: our only warning was the small shout
  // bubble. Triggered by the gap the chase already tracks; visual only.
  // It replaces the bubble under gapBanner, so only one warning shows.
  if (game.gap < CFG.gapBanner && (game.state === 'playing' || game.state === 'paused')) {
    const label = 'TOO CLOSE!';
    ctx.save();
    ctx.translate(CFG.canvasWidth / 2, 112);
    ctx.scale(1 + 0.03 * Math.sin(game.time * 8), 1 + 0.03 * Math.sin(game.time * 8));
    ctx.textAlign = 'center';
    ctx.font = 'bold 52px system-ui, sans-serif';
    const w = ctx.measureText(label).width + 48;
    ctx.fillStyle = 'rgba(122, 20, 16, 0.9)';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -38, w, 64, 12);
    ctx.fill();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.shadowColor = 'rgba(20, 8, 30, 0.6)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, 0, 8);
    ctx.restore();
  }
}

function hudDrawTitle(ctx, game) {
  const w = CFG.canvasWidth;
  const h = CFG.canvasHeight;
  ctx.fillStyle = 'rgba(26, 12, 32, 0.45)';
  ctx.fillRect(0, 0, w, h);

  ctx.textAlign = 'center';
  // Display treatment: a soft drop shadow lifts the flat cream title
  // off the dark sky (field titles use shadow/outline/serif for this).
  ctx.shadowColor = 'rgba(20, 8, 30, 0.55)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 5;
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 92px system-ui, sans-serif';
  ctx.fillText('FEAST OR FLIGHT', w / 2, 190);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.fillText("The Turkey's Great Escape", w / 2, 242);

  ctx.font = '20px system-ui, sans-serif';
  ctx.fillStyle = '#ffe9b8';
  ctx.fillText('Thanksgiving is coming. Farmer Joe wants dinner. You are dinner.', w / 2, 292);
  ctx.fillText('Outrun him to the Forest Gate — 1000m through the farmyard and the kitchen yard.', w / 2, 322);

  // Dark scrim behind the instructions, so the lines never collide with
  // the barn door or house silhouettes drifting behind them. v7: alpha
  // 0.5 let the barn's white X door show through right behind line 3 —
  // 0.72 buries it while the text on top stays crisp.
  ctx.fillStyle = 'rgba(26, 12, 32, 0.72)';
  ctx.beginPath();
  ctx.roundRect(w / 2 - 540, 356, 1080, 140, 12);
  ctx.fill();

  // How to play, with drawn mini icons.
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillStyle = '#ffd166';
  ctx.fillText('HOW TO PLAY', w / 2, 380);
  ctx.font = '19px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('SPACE / CLICK — jump      DOWN — duck under low branches', w / 2, 414);
  // Line 2 is the longest: it starts at x ~325, clear of the 1.6x
  // bird's beak (which reaches x ~279 on the title screen, after the
  // 90px left shift). Keep it short enough that the turkey never
  // covers its first word.
  ctx.fillText('Jump the fences, hay bales, ovens and knife carts. Grab corn for points.', w / 2, 444);
  ctx.fillText('Three feathers gone — or the gap gone — and you are caught.', w / 2, 474);

  // Start button.
  drawButton(ctx, w / 2 - 190, 520, 380, 62, 'CLICK OR PRESS SPACE TO RUN');
  // Footer on its own dark pill (like the mute note), so it reads on the
  // brown ground instead of dissolving into it.
  const footerLabel = 'P — pause      M — sound      R — restart';
  ctx.font = '16px system-ui, sans-serif';
  const footerW = ctx.measureText(footerLabel).width;
  ctx.fillStyle = 'rgba(26, 12, 32, 0.78)';
  ctx.beginPath();
  ctx.roundRect(w / 2 - footerW / 2 - 14, 602, footerW + 28, 28, 12);
  ctx.fill();
  ctx.fillStyle = '#ffe9b8';
  ctx.fillText(footerLabel, w / 2, 622);
  if (game.best > 0) {
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText('BEST SCORE ' + game.best, w / 2, 652);
  }
}

function hudDrawEnd(ctx, game) {
  const w = CFG.canvasWidth;
  const h = CFG.canvasHeight;
  const escaped = game.state === 'escaped';
  ctx.fillStyle = escaped ? 'rgba(20, 46, 20, 0.55)' : 'rgba(46, 10, 10, 0.6)';
  ctx.fillRect(0, 0, w, h);

  ctx.textAlign = 'center';
  ctx.fillStyle = escaped ? '#ffd166' : '#ff6b5e';
  ctx.font = 'bold 96px system-ui, sans-serif';
  ctx.fillText(escaped ? 'ESCAPED!' : 'CAUGHT!', w / 2, 240);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText(
    escaped
      ? 'You made it to the forest. No Thanksgiving dinner today.'
      : 'The farmer got you at ' + Math.floor(game.distance) + 'm. Dinner is served.',
    w / 2, 300,
  );

  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillStyle = '#ffd166';
  ctx.fillText('SCORE ' + game.score + '      DISTANCE ' + Math.floor(game.distance) + 'm', w / 2, 360);
  if (game.score > game.best && game.score > 0) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('NEW BEST SCORE!', w / 2, 396);
  }

  drawButton(ctx, w / 2 - 170, 440, 340, 62, 'RUN AGAIN  (R)');
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillText('Click the button or press R to run again', w / 2, 540);
}

function hudDrawPause(ctx) {
  const w = CFG.canvasWidth;
  const h = CFG.canvasHeight;
  ctx.fillStyle = 'rgba(26, 12, 32, 0.6)';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.fillText('PAUSED', w / 2, h / 2 - 10);
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillText('Press P or click to keep running', w / 2, h / 2 + 36);
}

function drawButton(ctx, x, y, w, h, label) {
  ctx.fillStyle = '#e85d3d';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 12);
  ctx.fill();
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2 + 9);
}
