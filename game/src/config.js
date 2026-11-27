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
  // ~205px (too big, per Ban), v6-v10 at 1.6 was ~172px — Ban 27 Nov
  // ~20:16 WIB: STILL too big. v11 at 1.45 lands ~158px, the midpoint
  // between 1.3 (too small) and 1.6 (too big). The duck pose is NOT
  // scaled: its head must stay clear of the hanging branch leaves.
  turkeyDrawScale: 1.45,
  jumpVelocity: 1000,
  gravity: 2900,

  // Run. v15: the ramp is steep now — Ban: "makin lama makin cepat,
  // jangan lambat terus". Old ramp (0.26/m, cap 640) only reached 640
  // exactly at the 1000m finish, so the run felt slow throughout
  // (380 at 0m, 458 at 300m, 549 at 650m). New: 0.62/m, cap 1000 —
  // 380 at 0m, 566 at 300m, 783 at 650m, 1000 at the gate. Run time
  // drops from ~33s to ~26s. The cap binds exactly at the finish.
  baseSpeed: 380,
  maxSpeed: 1000,
  speedPerMeter: 0.62,
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
  // Visual-only threshold for the big danger banner ("TOO CLOSE!"):
  // under this gap the banner replaces the small shout bubble. The
  // chase itself is untouched — only what the player sees changes.
  gapBanner: 30,

  // Lives and score.
  livesStart: 3,
  cornScore: 50,
  featherScore: 250,
  pieScore: 150,
  distanceScorePerMeter: 10,

  // Spawning: SECONDS between obstacle groups. v15: the gap is a time,
  // not a distance — the spatial gap scales with speed automatically
  // (gapPx = gapSec * speed), so the landing margin is the same at
  // 380 and at 1000 px/s. Jump air time is 2*1000/2900 = 0.69s, so
  // the minimum gap must stay above 0.69s + ~0.2s to land and react:
  // 0.95s leaves 0.26s of margin at any speed. Old px gaps (640-900)
  // gave only 0.64s at 1000 px/s — less than one jump — so they had
  // to go. At 1000 px/s the spatial gap is 950-1450px; a jump covers
  // 690px, so the turkey always lands with room before the next group.
  spawnMinGapSec: 0.95,
  spawnMaxGapSec: 1.45,

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
