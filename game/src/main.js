// Feast or Flight — the game itself: state machine, loop, input, scoring
// and the chase. States: title, playing, paused, caught, escaped.
const Game = {
  state: 'title',
  time: 0,
  distance: 0,
  score: 0,
  bonusScore: 0,
  lives: CFG.livesStart,
  gap: CFG.gapStart,
  speed: CFG.baseSpeed,
  best: 0,
  muted: false,
  turkey: null,
  farmer: null,
  field: null,
  world: null,
  rng: null,
  canvas: null,
  ctx: null,
  lastT: 0,
  shakeT: 0,
};

function gameSeedFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const s = parseInt(params.get('seed') || '', 10);
  return Number.isFinite(s) ? s : (Date.now() % 2147483647);
}

function gameInit() {
  Game.canvas = document.getElementById('game');
  Game.ctx = Game.canvas.getContext('2d');
  Game.rng = createRng(gameSeedFromUrl());
  gameReset();
  Game.state = 'title';
  window.addEventListener('keydown', gameOnKeyDown);
  window.addEventListener('keyup', gameOnKeyUp);
  Game.canvas.addEventListener('pointerdown', gameOnPointer);
  requestAnimationFrame(gameLoop);
}

function gameReset() {
  Game.distance = 0;
  Game.score = 0;
  Game.bonusScore = 0;
  Game.lives = CFG.livesStart;
  Game.gap = CFG.gapStart;
  Game.speed = CFG.baseSpeed;
  Game.shakeT = 0;
  Game.turkey = createTurkey();
  Game.farmer = createFarmer();
  Game.field = createObstacleField();
  Game.world = createWorld(Game.rng);
}

function gameStartRun() {
  AudioSys.init();
  gameReset();
  Game.state = 'playing';
  AudioSys.gobble();
}

function gameSpeedNow() {
  return Math.min(CFG.maxSpeed, CFG.baseSpeed + Game.distance * CFG.speedPerMeter);
}

function gameLoop(t) {
  const dt = Math.min(0.05, (t - Game.lastT) / 1000 || 0.016);
  Game.lastT = t;
  Game.time += dt;
  if (Game.state === 'playing') gameUpdate(dt);
  gameDraw();
  requestAnimationFrame(gameLoop);
}

function gameUpdate(dt) {
  Game.speed = gameSpeedNow();
  Game.distance += Game.speed * dt * CFG.metersPerPixel;
  Game.score = Math.floor(Game.distance) * CFG.distanceScorePerMeter + Game.bonusScore;

  turkeyUpdate(Game.turkey, dt);
  worldUpdate(Game.world, dt, Game.speed);
  obstacleUpdate(Game.field, dt, Game.speed, Game.distance, Game.rng);

  // The gap opens while the run is clean.
  Game.gap = Math.min(CFG.gapMax, Game.gap + CFG.gapRecoverPerSecond * dt);

  const events = obstacleCollisions(Game.field, turkeyBounds(Game.turkey));
  for (const ev of events) gameApplyEvent(ev);

  if (Game.shakeT > 0) Game.shakeT -= dt;

  // Finish: the forest gate.
  if (Game.distance >= CFG.finishDistance) {
    Game.state = 'escaped';
    Game.best = Math.max(Game.best, Game.score);
    AudioSys.escapeJingle();
    return;
  }
  // Caught: the farmer closed the gap, or the feathers ran out.
  if (Game.gap <= 0 || Game.lives <= 0) {
    gameCaught();
  }
}

function gameApplyEvent(ev) {
  if (ev.type === 'corn') {
    Game.bonusScore += CFG.cornScore;
    Game.gap = Math.min(CFG.gapMax, Game.gap + CFG.gapCornBonus);
    AudioSys.pickup();
  } else if (ev.type === 'feather') {
    Game.bonusScore += CFG.featherScore;
    AudioSys.feather();
  } else if (ev.type === 'pie') {
    Game.bonusScore += CFG.pieScore;
    Game.lives = Math.min(CFG.livesStart, Game.lives + 1);
    AudioSys.feather();
  } else if (ev.type === 'hit') {
    if (Game.turkey.invulnT > 0) return;
    Game.lives -= 1;
    Game.gap = Math.max(0, Game.gap - CFG.gapHitPenalty);
    Game.turkey.invulnT = 1.3;
    Game.shakeT = 0.35;
    AudioSys.hit();
    if (Game.lives <= 0) gameCaught();
  }
}

function gameCaught() {
  if (Game.state !== 'playing') return;
  Game.state = 'caught';
  Game.best = Math.max(Game.best, Game.score);
  AudioSys.caughtSting();
}

function gameDraw() {
  const ctx = Game.ctx;
  ctx.save();
  if (Game.shakeT > 0) {
    const s = Game.shakeT * 22;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  worldDraw(ctx, Game.world, Game.distance, Game.time);
  obstacleDraw(ctx, Game.field, Game.time);
  // On the title screen the farmer stands a little closer in, so his
  // whole figure is inside the frame instead of being cut at the edge.
  const farmerGap = Game.state === 'title' ? 84 : Game.gap;
  // On the title screen the farmer and the turkey are drawn AFTER the
  // overlay, so the turkey's fanned tail and the farmer's pitchfork sit
  // in front of the instructions scrim instead of dimming behind it.
  if (Game.state !== 'title') {
    farmerDraw(ctx, Game.turkey.x, farmerGap, Game.time);
    turkeyDraw(ctx, Game.turkey, Game.time);
  }
  ctx.restore();

  if (Game.state === 'playing' || Game.state === 'paused') {
    hudDraw(ctx, Game);
    if (Game.state === 'paused') hudDrawPause(ctx);
  } else if (Game.state === 'title') {
    hudDrawTitle(ctx, Game);
    // The 1.9x bird would cover the left end of the instruction lines
    // (its beak reaches x ~386, line 2 starts ~x 222), so on the title
    // screen the farmer and the turkey stand 90px further left, clear
    // of the text. Relative spacing is unchanged; only the pair moves.
    farmerDraw(ctx, Game.turkey.x - 90, farmerGap, Game.time);
    ctx.save();
    ctx.translate(-90, 0);
    turkeyDraw(ctx, Game.turkey, Game.time);
    ctx.restore();
  } else {
    hudDraw(ctx, Game);
    hudDrawEnd(ctx, Game);
  }
}

function gameOnKeyDown(e) {
  if (e.repeat) return;
  const k = e.code;
  if (k === 'Space' || k === 'ArrowUp' || k === 'KeyW') {
    e.preventDefault();
    AudioSys.init();
    if (Game.state === 'title' || Game.state === 'caught' || Game.state === 'escaped') {
      gameStartRun();
    } else if (Game.state === 'playing') {
      turkeyJump(Game.turkey);
    } else if (Game.state === 'paused') {
      Game.state = 'playing';
    }
  } else if (k === 'ArrowDown' || k === 'KeyS') {
    e.preventDefault();
    if (Game.state === 'playing') turkeyDuck(Game.turkey, true);
  } else if (k === 'KeyP' || k === 'Escape') {
    if (Game.state === 'playing') Game.state = 'paused';
    else if (Game.state === 'paused') Game.state = 'playing';
  } else if (k === 'KeyR') {
    if (Game.state !== 'title') gameStartRun();
  } else if (k === 'KeyM') {
    Game.muted = AudioSys.toggleMute();
  }
}

function gameOnKeyUp(e) {
  if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    turkeyDuck(Game.turkey, false);
  }
}

function gameOnPointer() {
  AudioSys.init();
  if (Game.state === 'title' || Game.state === 'caught' || Game.state === 'escaped') {
    gameStartRun();
  } else if (Game.state === 'playing') {
    turkeyJump(Game.turkey);
  } else if (Game.state === 'paused') {
    Game.state = 'playing';
  }
}

// Small debug handle for playtesting and screenshots: seed a run, stage a
// moment, or jump straight to a state. Not part of the visible game.
window.__feast = {
  game: Game,
  start: gameStartRun,
  setDistance(m) {
    Game.distance = m;
  },
  setGap(px) {
    Game.gap = px;
  },
  setLives(n) {
    Game.lives = n;
  },
  spawn(kind) {
    const dims =
      kind === 'oven'
        ? { w: 96, h: 118, flicker: 0 }
        : kind === 'knife'
        ? { w: 92, h: 112 }
        : kind === 'branch'
        ? { w: 120, h: 40 }
        : { w: 46, h: 62 };
    Game.field.items.push({ kind, x: 900, ...dims, passed: false });
  },
};

document.addEventListener('DOMContentLoaded', gameInit);
