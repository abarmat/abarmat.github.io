import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

const skipJunk = (src) => !path.basename(src).startsWith(".DS_Store");
cpSync(path.join(repoRoot, "src", "css"), path.join(distDir, "css"), { recursive: true, filter: skipJunk });
cpSync(path.join(repoRoot, "src", "assets"), path.join(distDir, "assets"), { recursive: true, filter: skipJunk });
cpSync(path.join(repoRoot, "CNAME"), path.join(distDir, "CNAME"));

function copyHashedSocialImages() {
  const sourceDir = path.join(repoRoot, "src", "assets", "images", "social");
  const targetDir = path.join(distDir, "assets", "images", "social");

  if (!existsSync(sourceDir)) {
    return;
  }

  mkdirSync(targetDir, { recursive: true });

  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    if (!entry.isFile() || !/\.(jpe?g|png|webp)$/i.test(entry.name)) {
      continue;
    }

    const sourcePath = path.join(sourceDir, entry.name);
    const hash = createHash("sha256").update(readFileSync(sourcePath)).digest("hex").slice(0, 8);
    const parsed = path.parse(entry.name);
    const targetPath = path.join(targetDir, `${parsed.name}.${hash}${parsed.ext}`);

    cpSync(sourcePath, targetPath);
  }
}

copyHashedSocialImages();

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
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

// Minify CSS (after Eleventy, which also copies CSS via passthrough)
const { transform } = await import("lightningcss");
const cssPath = path.join(distDir, "css", "style.css");
const { code } = transform({
  filename: cssPath,
  code: readFileSync(cssPath),
  minify: true,
});
writeFileSync(cssPath, code);
