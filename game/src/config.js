// Feast or Flight — shared tuning constants.
// One place for every number that shapes how the run feels, so the whole
// game can be retuned without touching the mechanics in the other files.
const CFG = {
  canvasWidth: 1280,
  canvasHeight: 720,
  groundY: 600,
  finishDistance: 1000,

  // Player.
  turkeyX: 230,
  turkeyWidth: 92,
  turkeyHeight: 84,
  turkeyDuckHeight: 46,
  // Draw-only scale for the standing pose: the bird renders bigger on
  // screen (field covers show heroes 1.5-3x ours; the strongest, Gobble
  // Dash, is ~290px tall at 1280-wide) while the hitbox, jump physics
  // and floor all keep using turkeyWidth/turkeyHeight, so the run plays
  // exactly as before. v4 at 1.3 was ~140px (too small), v5 at 1.9 was
  // ~205px (too big, per Ban) — 1.6 lands ~172px, between the two. The
  // duck pose is NOT scaled: its head must stay clear of the hanging
  // branch leaves.
  turkeyDrawScale: 1.6,
  jumpVelocity: 1000,
  gravity: 2900,

  // Run.
  baseSpeed: 380,
  maxSpeed: 640,
  speedPerMeter: 0.26,
  metersPerPixel: 0.06,

  // Farmer chase. The gap is the distance in pixels between the farmer
  // and the turkey; it closes on every stumble and opens while the run
  // is clean. Gap zero means the farmer has the turkey.
  gapStart: 150,
  gapMax: 200,
  gapRecoverPerSecond: 11,
  gapHitPenalty: 40,
  gapCornBonus: 3,
  gapDanger: 55,

  // Lives and score.
  livesStart: 3,
  cornScore: 50,
  featherScore: 250,
  pieScore: 150,
  distanceScorePerMeter: 10,

  // Spawning (seconds between obstacle groups, scaled by speed).
  // The minimum gap leaves room to land one jump before the next
  // obstacle arrives, so a narrow escape stays fair at top speed.
  spawnMinGapPx: 640,
  spawnMaxGapPx: 900,

  // Sunset palette.
  skyTop: '#2b1b4a',
  skyMid: '#7a2d5e',
  skyLow: '#e85d3d',
  horizon: '#f9a03f',
  sunColor: '#ffd166',
  hillFar: '#4a2a5e',
  hillNear: '#3a2048',
  groundTop: '#8a5a30',
  groundFill: '#5a3a22',
  grassColor: '#4a6b2f',

  // Stage boundaries in meters: farmyard, kitchen yard, forest edge.
  stageKitchen: 300,
  stageForest: 650,
};
