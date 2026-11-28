// Feast or Flight — the hand-in program for make.fun's turkey-run-game-01.
// Node 22 standard library only. It copies game/ and screenshots/ from
// this repository into the output directory and writes dossier.json with
// buildDossier from vendor/makefun-game.ts. It runs twice in grading and
// both runs must write the same bytes, so it does nothing time-dependent:
// no timestamps, no random choices, no reordering.
import { chmodSync, cpSync, existsSync, lstatSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : '/output';

// Fail fast with a readable message when the entry is incomplete, so a
// missing game/ or screenshots/ never produces a half-written /output.
if (!existsSync(join(repoRoot, 'game', 'index.html'))) {
  throw new Error('main.ts: game/index.html is missing');
}
if (!existsSync(join(repoRoot, 'screenshots')) || readdirSync(join(repoRoot, 'screenshots')).length < 3) {
  throw new Error('main.ts: screenshots/ must hold at least 3 images');
}

// Never remove outDir itself: the grader mounts /output writable but its
// parent read-only, so removing the directory itself fails with EACCES.
// Clear only its contents, one entry at a time, then (re)create it.
mkdirSync(outDir, { recursive: true });

// cpSync preserves the repo's read-only modes, so a previous run's game/
// and screenshots/ are read-only: deleting them needs write permission
// inside those directories first. Restore it top-down (a directory gets
// its write bit before descending into it), best effort; the remove below
// still fails loudly if the entry cannot be removed. Never follow a
// symlink out of the output directory.
function makeRemovable(path) {
  const st = lstatSync(path);
  if (st.isSymbolicLink()) return;
  try {
    chmodSync(path, st.isDirectory() ? 0o755 : 0o644);
  } catch {
    // Leave the error to the remove below.
  }
  if (st.isDirectory()) {
    for (const entry of readdirSync(path)) makeRemovable(join(path, entry));
  }
}

for (const entry of readdirSync(outDir)) {
  const path = join(outDir, entry);
  makeRemovable(path);
  rmSync(path, { recursive: true, force: true });
}

cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

// A short deterministic summary on stdout: the file counts and the
// dossier size. No timestamps or random values, so the two grading runs
// stay byte-identical in /output and identical on the console.
const shotCount = readdirSync(join(outDir, 'screenshots')).length;
console.log(`feast-or-flight: game/ + ${shotCount} screenshots -> ${outDir} (dossier.json ${dossier.length} bytes)`);
