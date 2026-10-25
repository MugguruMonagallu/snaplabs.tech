# Issue tracker: Linear

Issues and specs for this repo live in Linear. Use the `linear` MCP tools for all operations.

## Workspace & Scope

- **Workspace:** `mugguru-monagallu` (https://linear.app/mugguru-monagallu)
- **Team:** `Agentic Developers` (Key: `AD`, ID: `4e49179f-02e0-463e-885f-eb915d759232`)
- **Project:** `snaplabs.tech` (ID: `P-AD-7`, UUID: `942a0642-7c4c-4cbb-ac57-3668b419931e`)

## Conventions

- **Create an issue:** Call Linear MCP `save_issue` with `team: "AD"`, `project: "snaplabs.tech"`, `title: "..."`, `description: "..."`, and optional `labels: [...]`.
- **Read an issue:** Call Linear MCP `get_issue` with `id: "<identifier>"` (e.g. `AD-123`).
- **List issues:** Call Linear MCP `list_issues` with `project: "snaplabs.tech"`, `team: "AD"`, and filter by `label` or `state`.
- **Make an issue a sub-issue of a parent:** Call `save_issue` with `parentId: "<parent-id>"`.
- **Comment on an issue:** Call `save_comment` with `issueId: "<id>"`, `body: "..."`.
- **Apply / remove labels:** Call `save_issue` with `id: "<id>"`, `addLabels: [...]` / `removeLabels: [...]`.
- **Close an issue:** Call `save_issue` with `id: "<id>"`, `state: "Done"` (or `"Canceled"`).

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage` reads this flag.)_

## When a skill says "publish to the issue tracker"

Create a Linear issue in project `snaplabs.tech` (Team `AD`).

## When a skill says "fetch the relevant ticket"

Read it via `get_issue` as described in **Read an issue** above.

## Wayfinding operations

Used by `/wayfinder`.

- **Map:** An issue labelled `wayfinder:map` in project `snaplabs.tech`.
- **Child ticket:** An issue created with `parentId` set to the map issue, labelled `wayfinder:<type>`.
- **Blocking:** Linear native relations via `blockedBy: ["<blocker-id>"]` in `save_issue`.
- **Claim:** Update assignee with `save_issue(id="...", assignee="me")`.
- **Resolve:** Comment via `save_comment`, then close via `save_issue(id="...", state="Done")`.
