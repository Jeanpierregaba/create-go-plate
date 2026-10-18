# create-go-plate

Démarre n'importe quel projet d'application avec un cadrage prêt pour le développement avec un
agent de code (Claude Code, Codex, Cursor, Copilot, Gemini…).

```bash
npm create go-plate@latest mon-projet
```

Puis :

```bash
cd mon-projet
claude
```

et dans l'agent : `/cadrage`. L'agent te pose les questions et remplit le PRD, l'architecture,
le design, les règles, la stratégie de test, le backlog, l'outillage et le squelette du code,
avant toute ligne de fonctionnalité.

## Ce qui est généré

```
mon-projet/
├── AGENTS.md                 instructions de l'agent (source unique, standard multi-outils)
├── CLAUDE.md                 importe AGENTS.md (+ spécificités Claude Code)
├── TASKS.md                  avancement
├── README.md
├── .claude/
│   ├── settings.json         permissions (secrets, git destructif) + hooks
│   ├── hooks/                reprise de contexte, protection des fichiers, formatage auto
│   ├── skills/               /cadrage, /stress-test, /spec, /fin-de-session, /audit-securite
│   └── agents/               sous-agents reviewer et test-writer
├── .mcp.json                 Context7 (doc à jour), Playwright (tests navigateur)
├── .github/                  CI (squelette) + Dependabot
├── docs/
│   ├── PRD.md                quoi et pourquoi
│   ├── ARCHITECTURE.md       comment
│   ├── DESIGN.md             interface et expérience
│   ├── RULES.md              interdits stricts
│   ├── SECURITY.md           checklist sécurité
│   ├── TESTING.md            définition de « fini »
│   ├── SESSION-LOG.md        historique des sessions
│   ├── decisions/            ADR (une décision = un fichier)
│   └── specs/                une spec par fonctionnalité (spec → plan → tâches)
├── .env.example
├── .editorconfig
├── .gitignore
└── src/
```

En option : `docs/AI.md` et `evals/` pour les applications qui appellent un LLM.

## Options

```bash
npm create go-plate@latest mon-projet -- --yes --ai
```

| Option | Effet |
|---|---|
| `-y`, `--yes` | Choix par défaut, sans question |
| `--no-claude` | Sans CLAUDE.md, hooks, permissions ni `.mcp.json` |
| `--no-ci` | Sans GitHub Actions ni Dependabot |
| `--ai` | Ajoute le module « fonctionnalités IA » |
| `--no-git` | Sans `git init` |
| `-f`, `--force` | Autorise un dossier non vide |

Avec `npm create`, les options se placent après `--`. Avec `npx create-go-plate`, ce
n'est pas nécessaire.

## Le cycle de travail

1. `/cadrage` — une fois, au début.
2. `/spec <fonctionnalité>` — pour chaque fonctionnalité : spec, plan, tâches, validés avant le code.
3. `/fin-de-session` — à chaque arrêt. Au démarrage suivant, un hook redonne le contexte à l'agent.
4. `/audit-securite` — avant chaque mise en production.

## Prérequis

- Node.js ≥ 20.16 (pour le générateur et les hooks).
- Windows : les hooks passent par le shell ; installe Git for Windows (Git Bash).
  Pour le serveur MCP Playwright, remplace dans `.mcp.json` `"command": "npx"` par
  `"command": "cmd"` et préfixe les `args` par `"/c", "npx"`.

## Développer ce générateur

```bash
npm test
```

```bash
node bin/create.mjs /tmp/essai --yes
```

### Publier une version

1. Mettre à jour `CHANGELOG.md`.
2. `npm version patch` (ou `minor` / `major`).
3. `npm publish` — les tests sont relancés automatiquement avant la publication.

Le contenu généré vit dans `template/` (toujours copié) et `modules/<nom>/` (copiés selon les
choix). Le fichier `template/gitignore` est renommé en `.gitignore` à la génération, car npm
ne publie pas les fichiers `.gitignore`.
