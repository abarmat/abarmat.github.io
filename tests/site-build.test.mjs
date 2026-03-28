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
  const result = spawnSync("yarn", ["build"], {
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

    assert.match(rss, /<lastBuildDate>[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4}/);
    assert.match(rss, /<pubDate>[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4}/);
    assert.doesNotMatch(rss, /<pubDate>\d{4}-\d{2}-\d{2}T/);

    assert.match(
      atom,
      /<id>https:\/\/abarmat\.com\/tuned-to-the-mood-of-the-music\/<\/id>/,
    );

    assert.match(home, /<meta name="description" content="Personal blog and thoughts on technology, AI, and more"/);
    assert.match(home, /<link rel="canonical" href="https:\/\/abarmat\.com\/"/);

    assert.match(
      post,
      /https:\/\/medium\.com\/@abarmat\/tuned-to-the-mood-of-the-music-/,
    );
  });
});
