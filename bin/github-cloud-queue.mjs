#!/usr/bin/env node

import { queueGithubCloudIssue } from "../lib/github-cloud-queue.mjs";

const [issueNumber] = process.argv.slice(2);
if (!issueNumber) throw new Error("Usage: github-cloud-queue <issue-number>");
const result = await queueGithubCloudIssue({
  token: process.env.GITHUB_TOKEN,
  repository: process.env.GITHUB_REPOSITORY,
  issueNumber
});
process.stdout.write(`${JSON.stringify(result)}\n`);
