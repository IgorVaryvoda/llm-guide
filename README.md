# LLM & Claude Code Usage Guide

Practical tips for getting the most out of LLMs and Claude Code.

**TL;DR:**

1. **[Get a Max subscription](#1-use-a-subscription-plan-unless-you-enjoy-bankruptcy)** — Pay-as-you-go will bankrupt you. Max 100+ pays for itself immediately.
2. **[Write a CLAUDE.md](#2-write-a-good-claudemd)** — Build commands, style rules, "do NOT" rules. **Close the feedback loop**.
3. **[Install Skills & MCP servers](#3-use-skills-and-mcp-servers)** — [skills.sh](https://skills.sh/) for domain expertise, MCP for tool access.
4. **[Manage your context](#4-context-is-king)** — Use `/clear` between subtasks. Offload heavy work to subagents.
5. **[Set up pre-hooks](#5-use-pre-hooks-for-security-and-code-practice-warnings)** — Auto-block dangerous commands, scan for secrets, lint on write.
6. **[Use plan mode for non-trivial tasks](#6-workflow-plan-mode-and-how-to-actually-use-this-thing)** — Plan first, execute second. `/clear` between tasks.
7. **[Document big tasks](#7-document-everything-especially-big-tasks)** — Spec docs + TODO files survive across sessions. Claude can't remember, but it can read.
8. You can combine subagents with skills, skills with other skills and so on.
---

## 1. Use a Subscription Plan (Unless You Enjoy Bankruptcy)

Claude API usage on pay-as-you-go pricing adds up fast — especially with Opus. A single heavy coding session can cost more than a monthly subscription.

This brings us to another important question: which harness to use? Anthropic is known to be very strict about using their subscription plans with harnesses other than claude code or stuff that doesn't use Anthropic agent SDK, they can ban your account if you use it with stuff like OpenCode. This sucks and limits your options to Claude Code basically.

**What to do:**

- **Claude Pro / Max plans** — Pro plan has pathetic limits, so just use it to get the feel of the workflow. Upgrade to Max 100 plan when you're ready for more. I've been able to use the equivalent of $2-3k per month API credits on a Max 200 subscription easily.
- **Pick the right model for the task.** Usually it's Opus 4.6. Everything else can be used via subagents for simple tasks like code search. (Haiku is really fast and nice)

---

## 2. Write a Good CLAUDE.md

`CLAUDE.md` is your project's instruction manual for Claude. It's loaded into the system prompt every session, so Claude follows your rules without you repeating yourself.

Why it's important: instruct the model to complete the feedback loop! Tell it to run the build + typechecks/tests after significant changes, check stuff with Playwright or agent-browser and so on. You'll avoid a ton of mistakes and frustrations if you set the feedback loop correctly.

Everyone is moving to standardize the file as [AGENTS.md](https://agents.md/), but Anthropic seems reluctant so far. All other harnesses support AGENTS.md.

**Where it lives:**

- `~/.claude/CLAUDE.md` — Global instructions that apply to every project (your personal preferences).
- `CLAUDE.md` in your project root — Project-specific instructions (conventions, stack details, build commands).
- `CLAUDE.md` in subdirectories — Scoped instructions for specific parts of the codebase.

**What to put in it:**

- **Build & test commands** — `npm run dev && npm run test` etc.
- **Code style rules** — "Use `type` not `interface`". Whatever your team argues about, settle it here.
- **Do NOT rules** — "Never modify `schema.prisma` without asking first", "Don't add comments to translation files". These are the most valuable — they prevent mistakes before they happen.
- **Stack specifics** — Don't just say "it's a React 18 project with PostgreSQL" — actually link the appropriate docs. For example, Next.js has a codemod that generates an AGENTS.md with a full docs index:

```
npx @next/codemod agents-md --output CLAUDE.md
```

This produces a structured index the model can search through at runtime. [Why this works](https://vercel.com/blog/agents-md-outperforms-skills-in-our-agent-evals).

**Tips:**

- Keep the important info at the top and try not to bloat the file with useless shit.
- LLMs are actually very good at searching for stuff — so write some additional docs and point the model to their locations in the main CLAUDE.md file.

**Example snippet** (from [Apache Airflow's AGENTS.md](https://raw.githubusercontent.com/apache/airflow/refs/heads/main/AGENTS.md)):

```markdown
# AGENTS instructions

The main developer documentation lives in the `contributing-docs` directory. The following points summarise
how to set up the environment, run checks, build docs and follow the PR workflow.

## Local virtualenv and Breeze

- [`07_local_virtualenv.rst`](contributing-docs/07_local_virtualenv.rst) explains how to prepare a local
  Python environment using `uv`. The tool creates and syncs a `.venv` and installs dependencies with
  commands such as `uv venv` and `uv sync`.
- [`06_development_environments.rst`](contributing-docs/06_development_environments.rst) compares the local
  virtualenv with the Docker based Breeze environment. Breeze replicates CI and includes services like
  databases for integration tests.

## Running tests

- Use `pytest` inside the container for individual files or invoke `breeze testing` commands to run full
  suites, e.g. `breeze --backend postgres --python 3.10 testing tests --test-type All`.

## Pull request guidelines

- Follow the PR guidance in [`05_pull_requests.rst`](contributing-docs/05_pull_requests.rst). Always add
  tests, keep your branch rebased instead of merged, and adhere to the commit message recommendations from
  [cbea.ms/git-commit](https://cbea.ms/git-commit/).
```

---

## 3. Use Skills and MCP Servers

Claude Code becomes dramatically more useful when you extend it with **Skills** (reusable prompt-based capabilities) and **MCP servers** (tool integrations that give Claude access to external services).

**Skills:**

- Skills are specialized knowledge packs that teach Claude how to handle specific tasks — agent creation, MCP server creation, React best practices, anything really.
- Browse and install community skills from [skills.sh](https://skills.sh/).
- Skills live in `~/.claude/skills/` and activate automatically based on context.
- You invoke them with slash commands (e.g., `/frontend-design`, `/vercel-react-best-practices`) or they trigger automatically when relevant. **Automatic triggering is unreliable as hell, so invoke skills with slash commands or tell the LLM to use a particular skill or set of skills directly.**


**Recommended skills:**

1. [vercel-react-best-practices](https://skills.sh/vercel-labs/agent-skills/vercel-react-best-practices) + [vercel-composition-patterns](https://skills.sh/vercel-labs/agent-skills/vercel-composition-patterns) — Opus 4.6 is already very decent with React, but these skills help find stupid bugs.
2. [frontend-design](https://skills.sh/anthropics/skills/frontend-design) — Actually works, designs are very different from base LLM.
3. [agent-browser](https://skills.sh/vercel-labs/agent-browser/agent-browser) — Useful for letting the LLM check its own work visually and to catch console/network errors.
4. [skill-creator](https://skills.sh/anthropics/skills/skill-creator) — A skill to create your own skills.

**MCP Servers:**

- MCP (Model Context Protocol) servers let Claude interact with external tools and services — databases, APIs, CDNs, project management tools, etc.
- Configure them in `~/.claude/settings.json` or per-project in `.claude/settings.json`.

**Honestly though** — MCP servers aren't that great and everyone is trying to fix them with the next better thing. I don't really use many (Sentry + Stripe and that's it, everything else is handled via skills). Sentry integration is genuinely useful — fetch errors from Sentry and fix them all in one go, and it actually works.

---

## 4. Context Is King

Claude Code has a finite context window. Long research tangents, large file reads, and exploratory searches eat through it fast. When the context fills up, older messages get compressed and you lose nuance. The model gets dumber the more the context window is inflated. Autocompressions can work, but I prefer to clear the context entirely (`/clear` command) before each subtask.

**Subagents to the rescue:**

- The `Task` tool spawns independent agents that do work in their own context and return only the result.
- Use them for anything that would generate a lot of intermediate output: codebase exploration, multi-file searches, running tests, researching unfamiliar code.

**When to use subagents:**

- **Codebase exploration** — "How does auth work in this repo?" Let an `Explore` agent dig through the code instead of flooding your main context with file contents.
- **Parallel research** — Need to understand 3 different subsystems? Launch 3 agents simultaneously instead of reading files one at a time.
- **Test execution** — Long test output doesn't need to live in your conversation context.
- **Background tasks** — Run builds or linters in the background while you keep working.
- **Mass file changes** — Need to replace snippets of code that simple search & replace won't handle? Launch a couple of subagents to do the trick. With a proper feedback loop (testing etc.) this works nicely for massive changes in the codebase.

**When NOT to use subagents:**

- Simple, targeted lookups (reading a single known file, grepping for a specific function). Just use `Read` or `Grep` directly — spawning an agent for that is overhead with no benefit.

**Pro tip:** You can run subagents in the background with `run_in_background: true` and check on them later. Great for long-running tasks.

---

## 5. Use Pre-hooks for Security and Code Practice Warnings

Hooks are shell commands that run automatically before or after Claude Code tool calls. Use **pre-hooks** to catch problems before they happen.

**What hooks can do:**

- Block dangerous commands (force pushes, `rm -rf`, `reset --hard`) before they execute.
- Run linters or formatters on files before they're written.
- Check for secrets or credentials before commits.
- Enforce code style rules automatically.
- Warn about risky operations without fully blocking them.

**How to set them up:**

Hooks are configured in `~/.claude/settings.json` (global) or `.claude/settings.json` (per-project):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/your/security-check.sh"
          }
        ]
      }
    ]
  }
}
```

**Hook ideas worth implementing:**

- **Git safety hook** — Block `--force`, `--hard`, `--no-verify` flags unless explicitly confirmed.
- **Secrets scanner** — Run `gitleaks` or `trufflehog` before any `git commit` operation.
- **Lint gate** — Run ESLint/Prettier/Ruff on files before they're written to catch style issues immediately.
- **Dependency audit** — Check `npm audit` or `pip audit` before installing packages.
- **File size guard** — Warn if a file being written exceeds a reasonable size threshold.

**Hook behavior:**

- If a pre-hook exits with a non-zero status, the tool call is **blocked**.
- Hook stderr output is shown to Claude as feedback, so it can adjust its approach.
- This creates a feedback loop: Claude tries something risky, the hook blocks it, Claude reads the warning and tries a safer approach.

Bonus: [add Warcraft peon sounds via hooks](https://x.com/delba_oliveira/status/2020515010985005255).

---

## 6. Workflow: Plan Mode and How to Actually Use This Thing

Claude Code defaults to just doing stuff — reading files, writing code, running commands. For small tasks that's fine. For anything non-trivial, you want **plan mode**.

**What plan mode does:**

You type `/plan` or tell Claude to "plan this first". It switches into a mode where it can only research (read files, search, explore) but **cannot write or execute anything**. It produces a step-by-step plan, then asks for your approval before touching any code.

**Why this matters:**

Without plan mode, Claude will just start coding immediately. For a complex task this often means it goes down the wrong path, burns through context, and you end up with a mess you need to undo. Plan mode forces it to think before acting — explore the codebase, identify the right files, consider trade-offs, and lay out the approach.

**When to use it:**

- Any task that touches more than 2-3 files.
- Refactors, new features, architectural changes.
- When you're not sure how something should be implemented.
- When the codebase is unfamiliar — let Claude explore first.

**When to skip it:**

- Bug fixes where you already know the file and the problem.
- Small edits, typos, one-liner changes.
- Tasks where you've already given very specific instructions.

**The ideal workflow looks like this:**

1. `/clear` — Start with a clean context.
2. Describe the task. For anything non-trivial, tell Claude to plan first or use `/plan`.
3. Review the plan. Push back, ask questions, refine.
4. Approve the plan. Claude switches back to act mode and executes.
5. `/clear` — Clean up context before the next task.

**Combining plan mode with subagents:**

For large tasks, the best pattern is: plan in the main context, then delegate execution steps to subagents. This keeps your main context clean (just the plan + results) while subagents handle the messy details of reading files, running tests, and making changes.

**Tip:** You can also tell Claude to "plan this, but don't enter plan mode" — it'll write out a plan in the normal conversation without the formal mode switch. Useful when you want a quick outline but don't need the full ceremony.

---

## 7. Document Everything, Especially Big Tasks

Context disappears between sessions. You `/clear`, you close the terminal, you come back tomorrow — and Claude has no idea what you were doing. For anything that spans multiple sessions, **write it down in files Claude can read**.

**Spec docs for big features:**

Before you start building, enter plan mode and have Claude write a spec doc. Not a novel — a concise markdown file that captures the what, why, and how. Put it somewhere in the repo (e.g., `docs/specs/feature-name.md`).

This serves two purposes:
1. It forces you and Claude to agree on scope before any code is written.
2. Next session, you point Claude at the spec and it has full context immediately — no re-explaining.

**TODO files for tracking progress:**

For multi-session tasks, keep a `TODO.md` or `tasks.md` in the repo. Have Claude update it as work progresses — what's done, what's next, what's blocked. When you start a new session, Claude reads the file and picks up where it left off.

A simple format works:

```markdown
# Auth Refactor

## Done
- Migrated session store from Redis to Postgres
- Updated login endpoint to use new token format

## In Progress
- Updating middleware to validate new tokens (src/middleware/auth.ts)

## Next
- Update all protected routes to use new middleware
- Write integration tests
- Update API docs
```

**Why this matters:**

- Claude's memory between sessions is limited to a short summary. A spec doc or TODO file gives it the full picture.
- It also helps *you* — if you're juggling multiple features, a quick glance at the TODO tells you where each one stands.
- It's version-controlled. You can see how the plan evolved, revert bad decisions, and share progress with teammates.

**The pattern:**

1. Enter plan mode. Have Claude explore, research, and write a spec doc.
2. Review and approve the spec.
3. Create a TODO file with the implementation steps.
4. Work through the steps across sessions, updating the TODO as you go.
5. Each new session: "Read `docs/specs/feature.md` and `TODO.md`, then continue."

---

## Quick Reference

| Tip | Why |
|---|---|
| Subscription plan | Predictable costs, no bill shock |
| CLAUDE.md | Persistent project rules, no repeating yourself |
| Skills + MCP servers | Domain expertise + tool access |
| Subagents | Keep context clean, parallelize work |
| Pre-hooks | Automated guardrails against mistakes |
| Plan mode | Think before acting, avoid wasted context |
| Spec docs + TODOs | Persist context across sessions |

---

## Further Reading

- [Claude Code Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [Skills Directory](https://skills.sh/)
- [AGENTS.md Spec](https://agents.md/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Anthropic Cookbook](https://github.com/anthropics/anthropic-cookbook)
