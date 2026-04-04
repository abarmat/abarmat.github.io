import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const distDir = path.join(repoRoot, "dist");

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: "pipe",
    ...options,
  });
}

const headSha = run("git", ["rev-parse", "--short", "HEAD"]);
const siteCommitSha = headSha.status === 0 ? headSha.stdout.trim() : "";

const untracked = run("git", ["ls-files", "--others", "--exclude-standard", "--", "src"]);

if (untracked.error) {
  throw untracked.error;
}

if (untracked.status !== 0) {
  process.stderr.write(untracked.stderr ?? "");
  process.exit(untracked.status ?? 1);
}

const unexpectedFiles = untracked.stdout
  .split("\n")
  .map((file) => file.trim())
  .filter(Boolean);

if (unexpectedFiles.length > 0) {
  process.stderr.write("Build blocked: untracked source files would be published.\n");
  for (const file of unexpectedFiles) {
    process.stderr.write(`- ${file}\n`);
  }
  process.stderr.write(
    "Move drafts to an ignored path like src/drafts/, or ignore the file explicitly before building.\n",
  );
  process.exit(1);
}

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

cpSync(path.join(repoRoot, "src", "css"), path.join(distDir, "css"), { recursive: true });
cpSync(path.join(repoRoot, "src", "assets"), path.join(distDir, "assets"), { recursive: true });
cpSync(path.join(repoRoot, "CNAME"), path.join(distDir, "CNAME"));

const build = spawnSync("bunx", ["eleventy", ...process.argv.slice(2)], {
  cwd: repoRoot,
  env: {
    ...process.env,
    SITE_COMMIT_SHA: siteCommitSha,
  },
  stdio: "inherit",
});

if (build.error) {
  throw build.error;
}

process.exit(build.status ?? 0);
