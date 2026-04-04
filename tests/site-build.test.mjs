import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function runBuild() {
  const result = spawnSync("bun", ["run", "build"], {
    cwd: repoRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      FORCE_COLOR: "0",
    },
  });

  return {
    ...result,
    output: `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim(),
  };
}

function getHeadShortSha() {
  const result = spawnSync("git", ["rev-parse", "--short", "HEAD"], {
    cwd: repoRoot,
    encoding: "utf8",
  });

  assert.equal(result.status, 0, result.stderr ?? "failed to read git hash");
  return result.stdout.trim();
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

function write(relativePath, content) {
  const target = path.join(repoRoot, relativePath);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, content);
  return target;
}

test("site hardening regressions", async (t) => {
  await t.test("build removes stale dist files", () => {
    const stalePath = write("dist/__stale__/index.html", "<p>stale</p>");
    const result = runBuild();

    assert.equal(result.status, 0, result.output);
    assert.equal(existsSync(stalePath), false, "stale dist file should be removed");
  });

  await t.test("ignored draft content does not publish", () => {
    const draftPath = write(
      "src/drafts/regression-draft.md",
      `---
layout: post.njk
title: "Regression Draft"
date: "2026-03-28"
---

This should stay private.
`,
    );

    try {
      const result = runBuild();

      assert.equal(result.status, 0, result.output);
      assert.equal(
        existsSync(path.join(repoRoot, "dist/regression-draft/index.html")),
        false,
        "draft output should not exist",
      );
    } finally {
      rmSync(draftPath, { force: true });
      rmSync(path.dirname(draftPath), { recursive: true, force: true });
    }
  });

  await t.test("unexpected untracked content under src blocks the build", () => {
    const strayPath = write("src/untracked-build-guard.md", "unexpected content");

    try {
      const result = runBuild();

      assert.notEqual(result.status, 0, "build should fail for untracked source files");
      assert.match(result.output, /untracked/i);
    } finally {
      rmSync(strayPath, { force: true });
    }
  });

  await t.test("build emits standards-compliant feed output and site metadata", () => {
    const result = runBuild();

    assert.equal(result.status, 0, result.output);

    const rss = readFileSync(path.join(repoRoot, "dist/feed.rss"), "utf8");
    const atom = readFileSync(path.join(repoRoot, "dist/feed.atom"), "utf8");
    const home = readFileSync(path.join(repoRoot, "dist/index.html"), "utf8");
    const post = readFileSync(
      path.join(repoRoot, "dist/tuned-to-the-mood-of-the-music/index.html"),
      "utf8",
    );
    const shortSha = getHeadShortSha();

    assert.match(rss, /<lastBuildDate>[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4}/);
    assert.match(rss, /<pubDate>[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4}/);
    assert.doesNotMatch(rss, /<pubDate>\d{4}-\d{2}-\d{2}T/);

    assert.match(
      atom,
      /<id>https:\/\/abarmat\.com\/tuned-to-the-mood-of-the-music\/<\/id>/,
    );

    assert.match(home, /<meta name="description" content="Personal blog and thoughts on technology, AI, and more"/);
    assert.match(home, /<link rel="canonical" href="https:\/\/abarmat\.com\/"/);
    assert.match(home, new RegExp(shortSha));

    assert.match(
      post,
      /https:\/\/medium\.com\/@abarmat\/tuned-to-the-mood-of-the-music-/,
    );
  });

  await t.test("repo command surface is Bun-first", () => {
    const pkg = readJson("package.json");
    const justfilePath = path.join(repoRoot, "justfile");

    assert.match(pkg.packageManager, /^bun@/);
    assert.equal(existsSync(justfilePath), true, "justfile should exist");

    const justfile = readFileSync(justfilePath, "utf8");

    assert.match(justfile, /^default:/m);
    assert.match(justfile, /^install:/m);
    assert.match(justfile, /^dev:/m);
    assert.match(justfile, /^build:/m);
    assert.match(justfile, /^test:/m);
    assert.match(justfile, /^deploy:/m);
    assert.equal(existsSync(path.join(repoRoot, "bun.lock")), true, "bun.lock should exist");
    assert.equal(
      existsSync(path.join(repoRoot, "yarn.lock")),
      false,
      "yarn.lock should be removed",
    );
  });

  await t.test("bun install security policy is configured", () => {
    const pkg = readJson("package.json");
    const bunfigPath = path.join(repoRoot, "bunfig.toml");
    const readme = readFileSync(path.join(repoRoot, "README.md"), "utf8");

    assert.equal(existsSync(bunfigPath), true, "bunfig.toml should exist");

    const bunfig = readFileSync(bunfigPath, "utf8");
    const scannerVersion = pkg.devDependencies?.["@socketsecurity/bun-security-scanner"];

    assert.equal(
      typeof scannerVersion,
      "string",
      "scanner should be a declared dev dependency",
    );
    assert.doesNotMatch(
      scannerVersion,
      /^[~^]/,
      "scanner dependency should be pinned exactly",
    );
    assert.match(
      bunfig,
      /^\[install\.security\]\nscanner = "@socketsecurity\/bun-security-scanner"$/m,
    );
    assert.match(bunfig, /^\[install\]$/m);
    assert.match(bunfig, /^minimumReleaseAge = 604800$/m);
    assert.match(readme, /Socket scanner/i);
  });
});
