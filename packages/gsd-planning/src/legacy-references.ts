import { createHash } from "node:crypto";
import type { Dirent } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";
import { hasGeneratedProjectionHeader } from "./projections.js";
import type { LegacyReferenceRecord } from "./types.js";

export interface DiscoverLegacyMarkdownReferencesInput {
  readonly workspaceRoot: string;
}

export async function discoverLegacyMarkdownReferences(
  input: DiscoverLegacyMarkdownReferencesInput,
): Promise<readonly Omit<LegacyReferenceRecord, "discoveredAt">[]> {
  const workspaceRoot = resolve(input.workspaceRoot);
  const gsdRoot = join(workspaceRoot, ".gsd");
  const markdownPaths = await collectMarkdownPaths(gsdRoot);
  const references = await Promise.all(
    markdownPaths.map(async (absolutePath) => {
      const content = await readFile(absolutePath, "utf8");
      if (hasGeneratedProjectionHeader(content)) {
        return undefined;
      }
      const path = normalizeRelativePath(relative(workspaceRoot, absolutePath));
      return {
        id: `legacy:${path}`,
        path,
        title: extractTitle(content) ?? titleFromPath(path),
        excerpt: extractExcerpt(content),
        contentHash: hashContent(content),
      };
    }),
  );

  return references
    .filter((reference): reference is Omit<LegacyReferenceRecord, "discoveredAt"> => reference !== undefined)
    .sort((left, right) => left.path.localeCompare(right.path));
}

async function collectMarkdownPaths(root: string): Promise<readonly string[]> {
  const entries = await readDirectory(root);
  if (!entries) {
    return [];
  }

  const paths = await Promise.all(
    entries.map(async (entry) => {
      const path = join(root, entry.name);
      if (entry.isDirectory()) {
        return collectMarkdownPaths(path);
      }
      if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        return [path];
      }
      return [];
    }),
  );

  return paths.flat().sort((left, right) => left.localeCompare(right));
}

async function readDirectory(root: string): Promise<readonly Dirent[] | undefined> {
  try {
    return await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (isMissingFileError(error)) {
      return undefined;
    }
    throw error;
  }
}

function extractTitle(content: string): string | undefined {
  const heading = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith("# "));
  return heading?.replace(/^#+\s*/, "").trim() || undefined;
}

function extractExcerpt(content: string): string {
  const excerpt =
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.length > 0 && !line.startsWith("#") && !line.startsWith("<!--") && line !== "-->") ?? "";
  return excerpt.length > 220 ? `${excerpt.slice(0, 217)}...` : excerpt;
}

function titleFromPath(path: string): string {
  return basename(path, ".md")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function normalizeRelativePath(path: string): string {
  return path.split("\\").join("/");
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
