#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { deliverGithubIssueReturn, validateReturnRecord } from "../lib/github-issue-return.mjs";

const [commitSha, ...files] = process.argv.slice(2);
if (!commitSha || !files.length) throw new Error("Usage: github-issue-return <commit-sha> <return-record.json> [...]");
const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
if (!repository || !token) throw new Error("GITHUB_REPOSITORY and GITHUB_TOKEN are required");

for (const file of files) {
  const normalized = path.posix.normalize(String(file).replaceAll("\\", "/"));
  if (!normalized.startsWith("deliverables/chief-of-staff/return-channel/") || !normalized.endsWith(".json") || normalized.includes("..")) {
    throw new Error(`Unsafe return record path: ${file}`);
  }
  const record = JSON.parse(fs.readFileSync(normalized, "utf8"));
  const validated = validateReturnRecord(record, { repository });
  if (validated.artifactPath && !fs.existsSync(validated.artifactPath)) throw new Error(`Durable synthesis does not exist: ${validated.artifactPath}`);
  const result = await deliverGithubIssueReturn(record, { token, repository, commitSha });
  process.stdout.write(`${JSON.stringify({ file: normalized, ...result })}\n`);
}
