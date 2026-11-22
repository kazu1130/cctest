// デモ用のリリーススクリプト。実際には何も公開せず、次のバージョン候補を出力するだけ。
const fs = require("fs");
const semver = require("semver");
const { version, name } = require("../package.json");

const sha = (process.env.GITHUB_SHA || "local").slice(0, 7);
const ref = process.env.GITHUB_REF_NAME || "local";

if (!semver.valid(version)) {
  console.error(`Invalid version in package.json: ${version}`);
  process.exit(1);
}

const next = {
  patch: semver.inc(version, "patch"),
  minor: semver.inc(version, "minor"),
  major: semver.inc(version, "major"),
};

console.log(`Releasing ${name}@${version}`);
console.log(`  ref: ${ref}`);
console.log(`  sha: ${sha}`);
console.log("  next version candidates:");
for (const [type, v] of Object.entries(next)) {
  console.log(`    ${type.padEnd(5)} -> ${v}`);
}
console.log("Release finished (demo).");

// GitHub Actions 上では Job Summary にも書き出す
if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = Object.entries(next)
    .map(([type, v]) => `| ${type} | \`${v}\` |`)
    .join("\n");
  fs.appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    [
      `## 🚀 ${name}@${version}`,
      "",
      `ref: \`${ref}\` / sha: \`${sha}\``,
      "",
      "| 種類 | 次のバージョン |",
      "| --- | --- |",
      rows,
      "",
    ].join("\n"),
  );
}
