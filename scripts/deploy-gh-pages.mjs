// Deploys the static export (out/) to the GitHub Pages branch (gh-pages).
//
// Flow: npm run deploy → predeploy runs "npm run build" (setup-ocr-assets prebuild, then
// build-sw-precache postbuild) → this script checks gh-pages out into a temp worktree, replaces
// its content with out/, commits and pushes. GitHub Pages then publishes within a minute or two.
//
// GitHub Pages settings for this repo (set once, then stable): Source = "Deploy from a branch",
// Branch = gh-pages, Folder = / (root). Live at https://elbaash.github.io/Timegrapher-Charter/
//
// Note: the ~40 MB of OCR models/wasm get pushed on every deploy. Slow on a small upload
// connection, but correct — GitHub Pages can only serve what's in the branch, and the service
// worker precaches the whole set so the installed app survives offline.

import { execSync } from "node:child_process";
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { tmpdir } from "node:os";

const OUT = "out";
const BRANCH = "gh-pages";
const ROOT = process.cwd();

// Run a command, returning its stdout. Output is captured (not streamed).
const sh = (cmd, opts = {}) => {
  const out = execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], ...opts });
  return out ? out.toString().trim() : "";
};
// Run a command with live output (for slow operations like the ~40 MB push).
const run = (cmd, opts = {}) => {
  execSync(cmd, { stdio: "inherit", ...opts });
};

// 1. Verify the export exists and the SW precache was injected (postbuild ran).
let swText;
try {
  swText = readFileSync(join(OUT, "sw.js"), "utf8");
} catch {
  console.error("[deploy] out/sw.js not found — run 'npm run build' first (or 'npm run deploy').");
  process.exit(1);
}
if (swText.includes("__PRECACHE_MANIFEST__")) {
  console.error("[deploy] out/sw.js still has the placeholder — run 'npm run build' first.");
  process.exit(1);
}

// 2. Ensure a local gh-pages branch exists (one-time mirror of origin/gh-pages).
try {
  sh(`git rev-parse --verify refs/heads/${BRANCH}`, { cwd: ROOT });
} catch {
  sh(`git branch ${BRANCH} origin/${BRANCH}`, { cwd: ROOT });
}

// 3. Check the branch out into a throwaway worktree and reset it to whatever origin has,
//    so local drift can never corrupt a deploy.
run(`git fetch origin ${BRANCH}`, { cwd: ROOT });
const tmp = join(tmpdir(), `chronographer-deploy-${Date.now()}`);
run(`git worktree add --force "${tmp}" ${BRANCH}`, { cwd: ROOT });

try {
  run(`git reset --hard origin/${BRANCH}`, { cwd: tmp });

  // Remove everything except .git (a file in a worktree), then copy the fresh export in.
  for (const name of readdirSync(tmp)) {
    if (name === ".git") continue;
    rmSync(join(tmp, name), { recursive: true, force: true });
  }
  const copyTree = (dir) => {
    for (const name of readdirSync(dir)) {
      const src = join(dir, name);
      const dest = join(tmp, relative(OUT, src));
      if (statSync(src).isDirectory()) {
        mkdirSync(dest, { recursive: true });
        copyTree(src);
      } else {
        mkdirSync(dirname(dest), { recursive: true });
        copyFileSync(src, dest);
      }
    }
  };
  copyTree(OUT);

  // Commit + push (fast-forward; this script is the only writer to gh-pages now).
  sh("git add -A", { cwd: tmp });
  const dirty = sh("git status --porcelain", { cwd: tmp });
  if (!dirty) {
    console.log("[deploy] no changes — the deployed site is already up to date.");
    process.exit(0);
  }
  run(
    `git -c user.name="ChronoGrapher deploy" -c user.email="deploy@local" commit -m "Deploy ${new Date().toISOString()}"`,
    { cwd: tmp },
  );
  console.log("[deploy] pushing ~40 MB to gh-pages — this can take a while on slow uploads…");
  run(`git push origin ${BRANCH}`, { cwd: tmp });

  console.log("[deploy] pushed — GitHub Pages updates within a minute or two:");
  console.log("[deploy] https://elbaash.github.io/Timegrapher-Charter/");
} finally {
  run(`git worktree remove --force "${tmp}"`, { cwd: ROOT });
}
