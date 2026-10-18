import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "bin", "create.mjs");
const workDir = mkdtempSync(path.join(tmpdir(), "create-go-plate-"));
after(() => rmSync(workDir, { recursive: true, force: true }));

function create(name, ...flags) {
  const result = spawnSync(process.execPath, [cli, name, "--no-git", ...flags], { cwd: workDir, encoding: "utf8" });
  return { ...result, dir: path.join(workDir, name) };
}

function runHook(dir, hook, payload) {
  return spawnSync(process.execPath, [path.join(dir, ".claude", "hooks", hook)], {
    input: JSON.stringify(payload),
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
  });
}

test("génère la base et le module Claude par défaut", () => {
  const { status, stderr, dir } = create("defaut", "--yes");
  assert.equal(status, 0, stderr);
  for (const file of [
    "AGENTS.md",
    "CLAUDE.md",
    "TASKS.md",
    ".gitignore",
    ".env.example",
    ".mcp.json",
    ".claude/settings.json",
    ".claude/skills/cadrage/SKILL.md",
    ".claude/agents/reviewer.md",
    ".github/workflows/ci.yml",
    "docs/specs/_template/spec.md",
    "docs/decisions/0000-template.md",
  ]) {
    assert.ok(existsSync(path.join(dir, file)), `${file} manquant`);
  }
  assert.ok(!existsSync(path.join(dir, "gitignore")), "gitignore aurait dû être renommé");
  assert.ok(!existsSync(path.join(dir, "docs/AI.md")), "module IA non demandé");
  assert.match(readFileSync(path.join(dir, "README.md"), "utf8"), /^# defaut$/m);
  JSON.parse(readFileSync(path.join(dir, ".claude/settings.json"), "utf8"));
});

test("respecte --no-claude, --no-ci et --ai", () => {
  const { status, stderr, dir } = create("options", "--yes", "--no-claude", "--no-ci", "--ai");
  assert.equal(status, 0, stderr);
  assert.ok(!existsSync(path.join(dir, "CLAUDE.md")));
  assert.ok(!existsSync(path.join(dir, ".claude/settings.json")));
  assert.ok(!existsSync(path.join(dir, ".github")));
  assert.ok(existsSync(path.join(dir, ".claude/skills/spec/SKILL.md")), "les skills restent utiles aux autres agents");
  assert.ok(existsSync(path.join(dir, "docs/AI.md")));
  assert.match(readFileSync(path.join(dir, "AGENTS.md"), "utf8"), /docs\/AI\.md/);
  assert.doesNotMatch(readFileSync(path.join(dir, "docs/RULES.md"), "utf8"), /\[bloqué\]/);
});

test("refuse un dossier non vide sans --force", () => {
  const first = create("plein", "--yes");
  assert.equal(first.status, 0, first.stderr);
  assert.equal(create("plein", "--yes").status, 1);
  assert.equal(create("plein", "--yes", "--force").status, 0);
});

test("le hook protect-files bloque les secrets et le git destructif", () => {
  const { dir } = create("hooks", "--yes");
  const blocked = [
    { tool_name: "Read", tool_input: { file_path: path.join(dir, ".env") } },
    { tool_name: "Edit", tool_input: { file_path: path.join(dir, "apps/web/.env.local") } },
    { tool_name: "Write", tool_input: { file_path: path.join(dir, "package-lock.json") } },
    { tool_name: "Bash", tool_input: { command: "cat .env" } },
    { tool_name: "Bash", tool_input: { command: "cp .env.example .env" } },
    { tool_name: "Bash", tool_input: { command: "git push origin main --force" } },
    { tool_name: "Bash", tool_input: { command: "git reset --hard HEAD~3" } },
  ];
  for (const payload of blocked) {
    assert.equal(runHook(dir, "protect-files.mjs", payload).status, 2, JSON.stringify(payload));
  }
  const allowed = [
    { tool_name: "Read", tool_input: { file_path: path.join(dir, ".env.example") } },
    { tool_name: "Edit", tool_input: { file_path: path.join(dir, ".env.example") } },
    { tool_name: "Read", tool_input: { file_path: path.join(dir, "package-lock.json") } },
    { tool_name: "Edit", tool_input: { file_path: path.join(dir, "src/environment.ts") } },
    { tool_name: "Bash", tool_input: { command: "cat .env.example" } },
    { tool_name: "Bash", tool_input: { command: "git push --force-with-lease" } },
    { tool_name: "Bash", tool_input: { command: "npm run test" } },
  ];
  for (const payload of allowed) {
    assert.equal(runHook(dir, "protect-files.mjs", payload).status, 0, JSON.stringify(payload));
  }
});

test("le hook session-start redonne statut, tâches et dernière session", () => {
  const { dir } = create("reprise", "--yes");
  const first = runHook(dir, "session-start.mjs", {});
  assert.equal(first.status, 0, first.stderr);
  assert.match(first.stdout, /Statut du cadrage : NON FAIT/);
  assert.match(first.stdout, /\(aucune\)/);
  assert.doesNotMatch(first.stdout, /Dernière session/, "l'exemple en commentaire ne doit pas être pris pour une entrée");

  const logFile = path.join(dir, "docs/SESSION-LOG.md");
  writeFileSync(
    logFile,
    `${readFileSync(logFile, "utf8")}\n### 2026-10-18 — Auth\n- Prochaine étape : écran de connexion\n\n### 2026-10-17 — Cadrage\n- Fait : tout\n`
  );
  const second = runHook(dir, "session-start.mjs", {});
  assert.match(second.stdout, /2026-10-18 — Auth/);
  assert.doesNotMatch(second.stdout, /2026-10-17/);
});

test("le hook format ne fait rien tant que FORMAT_COMMAND est vide", () => {
  const { dir } = create("format", "--yes");
  const result = runHook(dir, "format.mjs", { tool_name: "Edit", tool_input: { file_path: path.join(dir, "README.md") } });
  assert.equal(result.status, 0, result.stderr);
});
