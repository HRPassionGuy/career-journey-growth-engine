import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const executives = JSON.parse(fs.readFileSync(new URL("../config/executives.json", import.meta.url)));
const capabilities = JSON.parse(fs.readFileSync(new URL("../config/capabilities.json", import.meta.url)));
const instances = JSON.parse(fs.readFileSync(new URL("../config/runtime-instances.json", import.meta.url)));

test("all capabilities have valid accountable and supporting executives", () => {
  for (const capability of capabilities) {
    assert.ok(executives[capability.owner], `${capability.id} has invalid owner`);
    for (const support of capability.support) assert.ok(executives[support], `${capability.id} has invalid support executive`);
  }
});

test("operational capabilities cover every executive", () => {
  const involved = new Set(capabilities.flatMap((item) => [item.owner, ...item.support]));
  for (const slug of Object.keys(executives)) assert.ok(involved.has(slug), `${slug} has no operational capability`);
});

test("every governing path exists", () => {
  for (const executive of Object.values(executives)) {
    for (const file of [executive.runtime, executive.charter, executive.procedures]) {
      assert.ok(fs.existsSync(new URL(`../${file}`, import.meta.url)), `${file} does not exist`);
    }
  }
});

test("all eight executives have independently invocable registered entry points", () => {
  assert.deepEqual(Object.keys(instances).sort(), Object.keys(executives).sort());
  for (const slug of Object.keys(executives)) {
    assert.match(instances[slug].threadId, /^[0-9a-f-]+$/);
    assert.equal(instances[slug].hostId, "codex-cloud");
    assert.equal(instances[slug].entryPoint, `./bin/executive ${slug}`);
  }
});

test("workflow records distinguish new external actions from prior verified work", () => {
  const state = JSON.parse(fs.readFileSync(new URL("../state/operating-state.example.json", import.meta.url)));
  for (const report of state.reports) {
    if (report.status === "completed") assert.ok(report.externalActionAt, `${report.id} lacks externalActionAt`);
    if (report.status === "verified_prior_work") assert.equal(report.externalActionAt, null, `${report.id} incorrectly claims a current external action`);
    assert.ok(report.verifiedAt, `${report.id} lacks verifiedAt`);
  }
});
