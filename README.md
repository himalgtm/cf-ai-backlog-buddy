# Backlog Buddy (Cloudflare Worker)

_Backlog Buddy_ is a small AI-powered agent built on Cloudflare that helps a developer
triage and act on their issue backlog.

It:

- Reads a backlog of issues (seeded in the agent state for this demo)
- Accepts natural-language instructions over chat
- Uses an LLM (Llama 3.3 on Workers AI) to reason about what to do next
- Responds with concrete next steps, including suggested git branches and commands
- Remembers recent conversation context per session

---

## Demo

- **Deployed URL:** `https://cf-ai-backlog-buddy.backlog-buddy.workers.dev/`  

---

## What Backlog Buddy does

Think of a typical dev backlog: issues like “implement first assigned task” or
“clean up irrelevant tickets”. Backlog Buddy acts as a tiny project manager +
coding buddy:

- You talk to it via a chat UI.
- It looks at the current backlog and your recent messages.
- It calls an LLM hosted on **Workers AI** (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`).
- It replies with a structured plan: what issue to work on, what branch to
  create, which git commands to run, and what to do next.
- It keeps **per-session memory** so conversations stay contextual.

Example prompts:

- “Implement and open a pull request for the first issue I have assigned to me.”
- “Clean up our backlog, cancelling any issues that are no longer relevant.”
- “Here’s an error message, where do you think it belongs?”

---

## Architecture

**High level:**

- **Cloudflare Worker (`src/index.ts`)**
  - Serves a minimal, but styled, single-page chat UI at `/`.
  - Routes `/agents/*` requests into the Agent infrastructure using
    `routeAgentRequest`.
  - Re-exports the `BacklogAgent` class so Wrangler can bind it as a Durable Object.

- **Agent / Durable Object (`src/backlogAgent.ts`)**
  - Class: `BacklogAgent` (extends `Agent` from the `agents` SDK).
  - Stores state in its own SQLite-backed storage:
    - `issues: Issue[]` – seeded backlog
    - `notes: string[]` – recent conversation log
    - `lastUpdated: string | null`
  - Exposes an HTTP interface:
    - `POST /agents/backlog-agent/:session/chat` – main chat endpoint
    - `GET  /agents/backlog-agent/:session/state` – debug state endpoint
  - For each chat message:
    1. Appends the message to `notes`.
    2. Builds a system + user prompt with the backlog and recent notes.
    3. Calls `env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", ...)`.
    4. Returns the LLM reply and updated state.

- **Workers AI**
  - Bound as `env.AI` via `wrangler.jsonc`:
    ```jsonc
    "ai": { "binding": "AI" }
    ```
  - Model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.

- **State & coordination**
  - Each distinct `:session` in the URL maps to its own `BacklogAgent`
    Durable Object instance.
  - The agent can be extended to schedule periodic clean-up or resync tasks
    (example `cleanupStaleNotes()` method is included as a starting point).

---

## Tech stack

- **Platform:** Cloudflare Workers
- **Agents & state:** Cloudflare Agents SDK + Durable Objects
- **LLM:** Workers AI – Meta Llama 3.3 70B Instruct
- **Language:** TypeScript
- **Build tooling:** `wrangler` (no extra bundler or framework)
- **UI:** Vanilla HTML + CSS + small inline JavaScript

---
