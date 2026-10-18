# Changelog

## 0.1.0 — 2026-10-18

Première version.

- Générateur `npm create go-plate` (interactif ou `--yes`), sans dépendance.
- Cadrage : `AGENTS.md` source unique, PRD, architecture, design, règles, sécurité, tests,
  journal de session, ADR, specs par fonctionnalité.
- Skills : `/cadrage`, `/stress-test`, `/spec`, `/fin-de-session`, `/audit-securite`.
- Sous-agents : `reviewer`, `test-writer`.
- Module Claude Code : permissions, hooks (reprise de contexte, protection des secrets et du git
  destructif, formatage automatique), `.mcp.json` (Context7, Playwright).
- Modules optionnels : CI GitHub Actions + Dependabot, fonctionnalités IA (`docs/AI.md`, `evals/`).
