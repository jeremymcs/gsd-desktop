import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const changedFileExtensions = new Set([
  ".css",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
]);

const addedLineChecks = [
  { label: "conflict marker", pattern: /^(<{7}|={7}|>{7})/ },
  { label: "debugger statement", pattern: /\bdebugger\b/ },
  { label: "focused test", pattern: /\b(?:describe|it|test)\.only\s*\(/ },
  { label: "console log", pattern: /\bconsole\.(?:debug|log|trace)\s*\(/ },
];

async function main() {
  const changedFiles = await getChangedFiles();
  const reviewableFiles = changedFiles.filter((file) => changedFileExtensions.has(extensionOf(file)));
  const diff = await getDiff(reviewableFiles);
  const findings = scanAddedLines(diff);

  if (findings.length > 0) {
    for (const finding of findings) {
      process.stderr.write(`${finding.file}:${finding.line}: ${finding.label}: ${finding.text}\n`);
    }
    process.exitCode = 1;
    return;
  }

  process.stdout.write(`Simplify check passed for ${reviewableFiles.length} changed file${reviewableFiles.length === 1 ? "" : "s"}.\n`);
}

async function getChangedFiles() {
  const { stdout } = await execFileAsync("git", ["diff", "--name-only", "--diff-filter=ACMRTUXB", "HEAD", "--"]);
  return stdout.split("\n").map((line) => line.trim()).filter(Boolean);
}

async function getDiff(files) {
  if (files.length === 0) {
    return "";
  }
  const { stdout } = await execFileAsync("git", ["diff", "--unified=0", "--", ...files], {
    maxBuffer: 16 * 1024 * 1024,
  });
  return stdout;
}

function scanAddedLines(diff) {
  const findings = [];
  let currentFile = "";
  let nextLine = 0;

  for (const line of diff.split("\n")) {
    if (line.startsWith("+++ b/")) {
      currentFile = line.slice("+++ b/".length);
      continue;
    }

    const hunk = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunk) {
      nextLine = Number(hunk[1]);
      continue;
    }

    if (!line.startsWith("+") || line.startsWith("+++")) {
      continue;
    }

    const text = line.slice(1);
    for (const check of addedLineChecks) {
      if (check.pattern.test(text)) {
        findings.push({
          file: currentFile,
          line: nextLine,
          label: check.label,
          text: text.trim(),
        });
      }
    }
    nextLine += 1;
  }

  return findings;
}

function extensionOf(file) {
  const index = file.lastIndexOf(".");
  return index === -1 ? "" : file.slice(index);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
