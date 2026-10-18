# create-go-plate

**Le point de départ structuré pour développer une application avec un agent de code.**

[![npm](https://img.shields.io/npm/v/create-go-plate?color=cb3837&logo=npm)](https://www.npmjs.com/package/create-go-plate)
[![Tests](https://github.com/Jeanpierregaba/create-go-plate/actions/workflows/test.yml/badge.svg)](https://github.com/Jeanpierregaba/create-go-plate/actions/workflows/test.yml)
[![Node](https://img.shields.io/node/v/create-go-plate?logo=node.js&logoColor=white)](https://nodejs.org)
[![Licence MIT](https://img.shields.io/npm/l/create-go-plate)](LICENSE)

```bash
npm create go-plate@latest mon-projet
```

Une commande, et ton projet démarre avec tout ce qu'il faut pour que l'agent (Claude Code, Codex,
Cursor, Copilot, Gemini…) construise **la bonne application, proprement, sans perdre le fil** :
cadrage produit et technique, spécifications par fonctionnalité, mémoire entre les sessions,
garde-fous de sécurité et vérifications automatiques.

---

## Sommaire

- [Pourquoi go-plate ?](#pourquoi-go-plate-)
- [Démarrage rapide](#démarrage-rapide)
- [Comment ça marche](#comment-ça-marche)
- [Ce qui est généré](#ce-qui-est-généré)
- [Les commandes de l'agent](#les-commandes-de-lagent)
- [Les garde-fous automatiques](#les-garde-fous-automatiques)
- [Options du générateur](#options-du-générateur)
- [Compatibilité](#compatibilité)
- [FAQ](#faq)
- [Contribuer](#contribuer)

---

## Pourquoi go-plate ?

Un agent de code écrit vite. Sans cadre, il écrit aussi vite **dans la mauvaise direction** :

| Sans cadrage | Avec go-plate |
|---|---|
| L'agent devine ce que tu veux construire | Un PRD et une spec par fonctionnalité, validés avant le code |
| Chaque session repart de zéro | Le contexte (tâches en cours, dernière session) est réinjecté automatiquement |
| Les choix techniques sont remis en cause en permanence | Chaque décision est tracée dans un ADR |
| Clés exposées, accès non contrôlés, dépendances inventées | Checklist sécurité, audit dédié, fichiers sensibles bloqués |
| « Ça marche » sans preuve | Lint, typecheck et tests lancés par l'agent, CI à chaque push |

go-plate ne choisit **aucune stack** à ta place : c'est l'agent qui te la propose pendant le
cadrage, en fonction de ton projet, et qui vérifie les versions à jour.

---

## Démarrage rapide

### Prérequis

- [Node.js](https://nodejs.org) 20.16 ou plus récent
- Un agent de code — de préférence [Claude Code](https://claude.com/claude-code), qui profite de
  toutes les fonctionnalités (voir [Compatibilité](#compatibilité))
- Git (recommandé)

### 1. Créer le projet

```bash
npm create go-plate@latest mon-projet
```

Le générateur pose 4 questions (Claude Code, CI GitHub, fonctionnalités IA, git) puis crée le
dossier avec un premier commit. Pour accepter les choix par défaut :

```bash
npm create go-plate@latest mon-projet -- --yes
```

### 2. Cadrer le projet

```bash
cd mon-projet
claude
```

Dans l'agent :

```
/cadrage
```

L'agent mène un entretien (4 questions maximum à la fois, avec des réponses proposées) et remplit
pour toi, étape par étape :

1. **Produit** — problème, utilisateurs, parcours, MVP, hors scope
2. **Architecture** — stack proposée et justifiée, versions vérifiées, ADR
3. **Design** — intention, design system, écrans, accessibilité
4. **Stress-test** — ce qui va casser, cas limites oubliés, sur-engineering
5. **Instructions de l'agent** — `AGENTS.md`
6. **Garde-fous** — règles, sécurité, stratégie de test
7. **Backlog** — `TASKS.md`
8. **Outillage** — CI, formatage automatique, variables d'environnement, serveurs MCP
9. **Squelette** — structure du code, qui compile et passe les tests à vide

Tu peux t'arrêter à tout moment : `/cadrage` reprend à la première étape non terminée.

### 3. Développer, une fonctionnalité à la fois

```
/spec inscription par email avec confirmation
```

L'agent crée `docs/specs/001-inscription/` avec la spec (le quoi), le plan (le comment) et la
liste des tâches. **Tu valides chaque étape avant qu'il écrive du code.**

---

## Comment ça marche

```
 npm create go-plate                    une fois
        │
        ▼
 /cadrage ─────────────────────────────  une fois : PRD, architecture, règles, backlog, squelette
        │
        ▼
 ┌─► /spec <fonctionnalité> ───────────  spec → plan → tâches, validés par toi
 │      │
 │      ▼
 │   implémentation tâche par tâche ──   lint + typecheck + tests après chaque tâche, commit
 │      │
 │      ▼
 │   relecture (sous-agent reviewer)
 │      │
 │      ▼
 └── /fin-de-session ──────────────────  TASKS.md + SESSION-LOG.md à jour
        │
        ▼
 session suivante ─────────────────────  le hook SessionStart redonne le contexte à l'agent

 avant la mise en production : /audit-securite
```

Le principe : **les documents sont la mémoire du projet**, les skills sont les procédures, les
hooks et permissions sont les règles que l'agent ne peut pas contourner.

---

## Ce qui est généré

```
mon-projet/
├── AGENTS.md                  instructions de l'agent — source unique, lue par tous les outils
├── CLAUDE.md                  importe AGENTS.md + spécificités Claude Code
├── TASKS.md                   avancement : en cours / à faire / terminé
├── README.md
├── .claude/
│   ├── skills/                /cadrage, /spec, /stress-test, /fin-de-session, /audit-securite
│   ├── agents/                sous-agents reviewer et test-writer
│   ├── hooks/                 reprise de contexte, protection des fichiers, formatage
│   └── settings.json          permissions et branchement des hooks
├── .mcp.json                  Context7 (doc à jour des bibliothèques), Playwright (navigateur)
├── .github/
│   ├── workflows/ci.yml       CI à compléter pendant le cadrage
│   └── dependabot.yml         mises à jour de sécurité automatiques
├── docs/
│   ├── PRD.md                 quoi construire et pourquoi
│   ├── ARCHITECTURE.md        comment c'est construit
│   ├── DESIGN.md              interface et expérience
│   ├── RULES.md               interdits stricts
│   ├── SECURITY.md            checklist sécurité
│   ├── TESTING.md             définition de « fini »
│   ├── SESSION-LOG.md         journal des sessions
│   ├── decisions/             ADR : une décision technique = un fichier
│   └── specs/                 une spec par fonctionnalité (spec → plan → tâches)
├── src/                       squelette créé à la fin du cadrage
├── .env.example
├── .editorconfig
└── .gitignore
```

En option (`--ai`) : `docs/AI.md` et `evals/` pour les applications qui appellent un LLM
(prompts versionnés, évaluations, coûts, injection de prompt).

Tous les fichiers sont des **modèles commentés** : chaque section explique ce qu'elle doit
contenir. Rien ne t'oblige à passer par l'agent pour les remplir.

---

## Les commandes de l'agent

| Commande | Quand l'utiliser | Ce qu'elle fait |
|---|---|---|
| `/cadrage` | Au début du projet | Entretien guidé et remplissage de tous les documents, jusqu'au squelette du code |
| `/spec <description>` | Avant chaque fonctionnalité | Crée la spec, le plan et les tâches, à valider avant le code |
| `/stress-test [fichier]` | Après un document important | Relecture critique : risques, cas limites, sur-engineering, contradictions |
| `/fin-de-session` | À chaque arrêt | Met à jour l'avancement, le journal et les décisions |
| `/audit-securite [périmètre]` | Avant une mise en production | Vérifie la checklist sécurité dans le code réel, rapport classé par gravité |

Deux **sous-agents** complètent les skills :

- **`reviewer`** relit les changements (exactitude, sécurité, règles, tests, simplicité) sans
  modifier le code.
- **`test-writer`** écrit les tests à partir de la spec, y compris avant l'implémentation pour
  les parties critiques.

---

## Les garde-fous automatiques

Avec Claude Code, ces règles sont **appliquées techniquement**, pas seulement demandées :

| Protection | Mécanisme |
|---|---|
| L'agent ne lit ni ne modifie les fichiers `.env`, clés et certificats (`.env.example` reste accessible) | Hook `PreToolUse` + permissions |
| Pas de `git push --force` ni de `git reset --hard` | Hook `PreToolUse` + permissions |
| Pas de modification manuelle des fichiers de lock ni du dossier `.git` | Hook `PreToolUse` |
| `git push`, `rm -rf`, `git clean`, `npm publish` demandent confirmation | Permissions |
| Chaque fichier modifié est formaté | Hook `PostToolUse` (formateur choisi pendant le cadrage) |
| Chaque session démarre avec le statut du cadrage, les tâches en cours et la dernière session | Hook `SessionStart` |

Les hooks sont de simples scripts Node, lisibles et modifiables dans `.claude/hooks/`.

---

## Options du générateur

```bash
npm create go-plate@latest [dossier] -- [options]
```

| Option | Effet |
|---|---|
| `-y`, `--yes` | Accepte les choix par défaut sans poser de question |
| `--no-claude` | Sans les fichiers propres à Claude Code (`CLAUDE.md`, hooks, permissions, `.mcp.json`) |
| `--no-ci` | Sans GitHub Actions ni Dependabot |
| `--ai` | Ajoute le module « fonctionnalités IA » |
| `--no-git` | Sans initialiser de dépôt git |
| `-f`, `--force` | Autorise un dossier cible non vide (les fichiers de même nom sont écrasés) |
| `-h`, `--help` | Affiche l'aide |
| `-v`, `--version` | Affiche la version |

Avec `npm create`, les options se placent après `--`. Les commandes suivantes sont équivalentes :

```bash
npx create-go-plate mon-projet --yes
```

```bash
pnpm create go-plate mon-projet --yes
```

```bash
yarn create go-plate mon-projet --yes
```

```bash
bun create go-plate mon-projet --yes
```

---

## Compatibilité

| Agent | Niveau de prise en charge |
|---|---|
| **Claude Code** | Complet : `CLAUDE.md`, skills en commandes `/`, sous-agents, hooks, permissions, MCP |
| **Codex, Cursor, GitHub Copilot, Gemini CLI…** | `AGENTS.md` est lu nativement ; les skills sont des fichiers Markdown que l'agent peut suivre (« suis `.claude/skills/spec/SKILL.md` ») |

| Système | Remarque |
|---|---|
| macOS, Linux | Aucune configuration particulière |
| Windows | Installer [Git for Windows](https://git-scm.com/download/win) (les hooks passent par Git Bash). Pour le serveur MCP Playwright, remplacer `"command": "npx"` par `"command": "cmd"` et préfixer les `args` par `"/c", "npx"` dans `.mcp.json` |

---

## FAQ

**Quelle stack technique est utilisée ?**
Aucune n'est imposée. Pendant `/cadrage`, l'agent propose une stack adaptée à ton projet et à ton
niveau, avec une alternative et les compromis, puis vérifie les versions actuelles dans la
documentation officielle.

**Je ne suis pas développeur, est-ce pour moi ?**
Oui : le cadrage est un entretien en langage courant, et l'agent justifie chaque choix technique.
Le cadre sert justement à éviter les pièges classiques des projets construits avec l'IA.

**Puis-je l'ajouter à un projet existant ?**
Oui, avec `--force` dans le dossier du projet, mais les fichiers de même nom (`README.md`,
`.gitignore`…) sont **écrasés**. Le plus sûr : générer dans un dossier à part, puis copier ce
dont tu as besoin.

```bash
npm create go-plate@latest go-plate-tmp -- --yes --no-git
```

**Je n'ai pas besoin de tous les fichiers.**
Supprime-les : chaque document est indépendant. Pense seulement à retirer sa ligne dans le
tableau « Où ranger quoi » d'`AGENTS.md`.

**Le contenu est-il en anglais ?**
Non, tous les modèles sont en français. L'agent te répondra dans la langue de tes messages.

**Comment mettre à jour un projet déjà généré ?**
Le générateur ne sait pas mettre à jour un projet existant. Pour profiter d'une nouvelle version, génère
un projet temporaire et compare les fichiers qui t'intéressent (skills, hooks).

---

## Contribuer

Les suggestions et corrections sont les bienvenues via les
[issues](https://github.com/Jeanpierregaba/create-go-plate/issues) et les pull requests.

```bash
git clone https://github.com/Jeanpierregaba/create-go-plate.git
```

```bash
cd create-go-plate && npm test
```

Essayer le générateur en local :

```bash
node bin/create.mjs /tmp/essai --yes
```

| Dossier | Contenu |
|---|---|
| `bin/create.mjs` | Le générateur (aucune dépendance, uniquement Node) |
| `template/` | Fichiers copiés dans tous les projets |
| `modules/claude/`, `modules/ci-github/`, `modules/ai/` | Fichiers copiés selon les options |
| `test/` | Tests (`node --test`) |

Le fichier `template/gitignore` est renommé en `.gitignore` à la génération, car npm ne publie
pas les fichiers `.gitignore`.

### Publier une version

1. Mettre à jour `CHANGELOG.md`.
2. `npm version patch` (ou `minor` / `major`).
3. `npm publish` — les tests sont relancés automatiquement avant la publication.
4. `git push --follow-tags`

---

## Licence

[MIT](LICENSE) © 2026 Jeanpierregaba
