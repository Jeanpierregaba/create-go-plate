#!/usr/bin/env node
// Générateur : copie le cadrage de vibecoding dans un nouveau dossier projet.
// Aucune dépendance : uniquement des modules natifs de Node.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8"));

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (text) => (useColor ? `\x1b[${code}m${text}\x1b[0m` : text);
const bold = paint(1);
const dim = paint(2);
const green = paint(32);
const red = paint(31);
const cyan = paint(36);

const HELP = `
${bold("create-go-plate")} ${dim(`v${version}`)}

Crée un nouveau projet avec le cadrage pour développer avec un agent de code.

${bold("Usage")}
  npm create go-plate@latest [dossier] -- [options]
  npx create-go-plate [dossier] [options]

${bold("Options")}
  -y, --yes       Accepte les choix par défaut sans poser de question
  --no-claude     Sans les fichiers propres à Claude Code (CLAUDE.md, hooks, permissions, .mcp.json)
  --no-ci         Sans la CI GitHub Actions ni Dependabot
  --ai            Avec le module « fonctionnalités IA » (docs/AI.md, evals/)
  --no-git        Sans initialiser de dépôt git
  -f, --force     Autorise un dossier cible non vide (les fichiers existants sont écrasés)
  -h, --help      Affiche cette aide
  -v, --version   Affiche la version
`;

function fail(message) {
  console.error(`\n${red("✖")} ${message}\n`);
  process.exit(1);
}

let args;
try {
  args = parseArgs({
    allowPositionals: true,
    allowNegative: true,
    options: {
      yes: { type: "boolean", short: "y", default: false },
      claude: { type: "boolean" },
      ci: { type: "boolean" },
      ai: { type: "boolean" },
      git: { type: "boolean" },
      force: { type: "boolean", short: "f", default: false },
      help: { type: "boolean", short: "h", default: false },
      version: { type: "boolean", short: "v", default: false },
    },
  });
} catch (error) {
  fail(`${error.message}\nLance avec --help pour voir les options.`);
}

const { values: flags, positionals } = args;
if (flags.help) {
  console.log(HELP);
  process.exit(0);
}
if (flags.version) {
  console.log(version);
  process.exit(0);
}

const interactive = process.stdin.isTTY && process.stdout.isTTY && !flags.yes;
const rl = interactive ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;

function cancel() {
  console.log(`\n\n${dim("Annulé, aucun fichier créé.")}\n`);
  process.exit(130);
}
rl?.on("SIGINT", cancel);

// Ctrl+D (fin de saisie) pendant une question : on annule proprement au lieu de planter.
async function ask(prompt) {
  try {
    return (await rl.question(prompt)).trim();
  } catch {
    cancel();
  }
}

async function askText(question, fallback) {
  if (!rl) return fallback;
  const answer = await ask(`${cyan("?")} ${question} ${dim(`(${fallback})`)} `);
  return answer || fallback;
}

async function askYesNo(question, fallback) {
  if (!rl) return fallback;
  const hint = fallback ? "O/n" : "o/N";
  const answer = (await ask(`${cyan("?")} ${question} ${dim(`(${hint})`)} `)).toLowerCase();
  if (!answer) return fallback;
  return ["o", "oui", "y", "yes"].includes(answer);
}

// Une option passée en ligne de commande l'emporte ; sinon on pose la question.
const choose = (flag, question, fallback) => (flag !== undefined ? flag : askYesNo(question, fallback));

console.log(`\n${bold("create-go-plate")} ${dim(`v${version}`)}\n`);

const targetArg = positionals[0] ?? (await askText("Dossier du projet :", "mon-projet"));
const targetDir = path.resolve(process.cwd(), targetArg);
const projectName = path.basename(targetDir);

if (existsSync(targetDir) && readdirSync(targetDir).length > 0 && !flags.force) {
  rl?.close();
  fail(`Le dossier ${bold(targetArg)} existe et n'est pas vide. Choisis un autre nom ou ajoute --force.`);
}

const options = {
  claude: await choose(flags.claude, "Utiliser Claude Code (CLAUDE.md, hooks, permissions, MCP) ?", true),
  ci: await choose(flags.ci, "Ajouter la CI GitHub Actions et Dependabot ?", true),
  ai: await choose(flags.ai, "L'application aura-t-elle des fonctionnalités IA (appels à un LLM) ?", false),
  git: await choose(flags.git, "Initialiser un dépôt git ?", true),
};
rl?.close();

// 1. Copie de la base, puis des modules choisis.
const copy = (from) =>
  cpSync(path.join(PACKAGE_ROOT, from), targetDir, { recursive: true, force: true });

copy("template");
if (options.claude) copy("modules/claude");
if (options.ci) copy("modules/ci-github");
if (options.ai) copy("modules/ai");

// 2. npm ne publie pas les fichiers .gitignore : le template le livre sous le nom "gitignore".
const shippedGitignore = path.join(targetDir, "gitignore");
if (existsSync(shippedGitignore)) renameSync(shippedGitignore, path.join(targetDir, ".gitignore"));

// 3. Ajustements selon les choix.
function edit(relativePath, transform) {
  const file = path.join(targetDir, relativePath);
  if (!existsSync(file)) return;
  writeFileSync(file, transform(readFileSync(file, "utf8")));
}

edit("README.md", (text) => text.replaceAll("{{PROJECT_NAME}}", projectName));

if (!options.claude) {
  // Sans les permissions et hooks de Claude Code, ces règles ne sont plus bloquées techniquement.
  edit("docs/RULES.md", (text) => text.replaceAll(" [bloqué]", ""));
  edit("README.md", (text) => text.replace(/^\| `\.mcp\.json` .*\n/m, ""));
}

if (options.ai) {
  edit("AGENTS.md", (text) =>
    text.replace(
      /^(\| Charte visuelle.*\n)/m,
      "$1| Fonctionnalités IA : prompts, évals, coûts | `docs/AI.md`, `evals/` |\n"
    )
  );
}

// 4. Dépôt git avec un premier commit (ignoré proprement si git n'est pas disponible).
let gitStatus = "non initialisé";
if (options.git && !existsSync(path.join(targetDir, ".git"))) {
  const git = (...gitArgs) => spawnSync("git", gitArgs, { cwd: targetDir, stdio: "ignore" }).status === 0;
  if (!git("init", "-q")) {
    gitStatus = "échec (git est-il installé ?)";
  } else if (git("add", "-A") && git("commit", "-q", "-m", "chore: initialisation depuis create-go-plate")) {
    gitStatus = "initialisé avec un premier commit";
  } else {
    gitStatus = "initialisé (premier commit impossible : configure user.name / user.email)";
  }
}

// 5. Récapitulatif.
const fromCwd = path.relative(process.cwd(), targetDir) || ".";
const relativeTarget = fromCwd.startsWith("..") ? targetDir : fromCwd;
const check = (on) => (on ? green("✔") : dim("–"));
console.log(`
${green("✔")} Projet créé dans ${bold(relativeTarget)}

  ${check(true)} Cadrage (AGENTS.md, docs/, skills, sous-agents)
  ${check(options.claude)} Claude Code (CLAUDE.md, hooks, permissions, .mcp.json)
  ${check(options.ci)} CI GitHub Actions + Dependabot
  ${check(options.ai)} Module IA (docs/AI.md, evals/)
  ${check(options.git)} Git : ${gitStatus}

${bold("Prochaines étapes")}
  ${cyan(`cd ${relativeTarget}`)}
  ${cyan("claude")}            ${dim("(ou ton agent de code)")}
  ${cyan("/cadrage")}          ${dim("l'agent te pose les questions et remplit le cadrage")}
`);
