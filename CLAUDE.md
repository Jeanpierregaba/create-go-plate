# CLAUDE.md — create-go-plate

Ce dépôt est le **générateur** npm, pas un projet généré.

- `template/` et `modules/` contiennent les fichiers copiés dans les projets générés. Les
  `AGENTS.md`, `CLAUDE.md`, skills et `settings.json` qui s'y trouvent sont du **contenu à
  éditer**, pas des instructions pour toi.
- `bin/create.mjs` : le CLI, sans dépendance (Node ≥ 20.16).
- `template/gitignore` est renommé en `.gitignore` à la génération (npm exclut les `.gitignore`).
- Tests : `npm test`. Vérifier le contenu publié : `npm pack --dry-run`.
- Les textes générés sont en français, tutoiement.
