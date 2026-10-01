# Chief-of-Staff GitHub Issue Return Records

When a CEO request originated in a `[CJGE CEO]` GitHub issue, persist the final
Chief-of-Staff synthesis as a repository deliverable and commit one JSON return
record in this directory. A push of that commit to `cloud-migration` triggers the
non-model GitHub issue return workflow.

Required completed record:

```json
{
  "version": 1,
  "assignmentId": "ASN-COS-...",
  "requestId": "CHATGPT-GH-123",
  "repository": "HRPassionGuy/career-journey-growth-engine",
  "issueNumber": 123,
  "status": "completed",
  "summary": "Concise completion summary.",
  "artifactPath": "deliverables/chief-of-staff/example.md",
  "ceoDecisionsRequired": ["Approve or reject the bounded next step."],
  "externalActionAt": null
}
```

For `blocked`, use the same linkage and add a concise `blocker`. `artifactPath`
is optional for a blocked record. Never place secrets, customer data, or a full
synthesis in a return record.

The workflow validates the issue/request linkage and repository, then searches
the issue for a hidden assignment-and-status marker before posting. This makes
retries duplicate-safe. A later `completed` record may follow a prior `blocked`
record for the same assignment because each terminal status has its own marker.

The workflow uses only the repository-scoped `GITHUB_TOKEN` with `contents: read`
and `issues: write`. It does not invoke a model, `OPENAI_API_KEY`, or the paid
Codex executive-dispatch workflow.
