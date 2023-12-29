#!/usr/bin/env node --experimental-modules

import inquirer from "inquirer";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import process from "node:process";

const req = createRequire(import.meta.url);
const goodreporc = {};
const cwd = process.cwd();
const cmd = { cwd, stdio: "inherit" };
const goodreporcFile = path.join(cwd, ".goodreporc.json");
const czrcFile = path.join(cwd, ".cz.json");
const commitlintrcFile = path.join(cwd, ".commitlintrc.json");
const lintstagedrcFile = path.join(cwd, ".lintstagedrc.json");
const releaseitrcFile = path.join(cwd, ".release-it.json");
const prettierrcFile = path.join(cwd, ".prettierrc.json");

try {
  Object.assign(goodreporc, req(goodreporcFile));
} catch (error) {}

const czrc = { path: "@commitlint/cz-commitlint" };

/** @type {import("prettier").Config} */
const prettierrc = {
  useTabs: false, // 采用 tab 缩进还是空白缩进
  tabWidth: 2, // tab 键宽度
  printWidth: 80, // 使用较大的打印宽度，因为 Prettier 的换行设置似乎是针对没有注释的 JavaScript.
  singleQuote: false, // 字符串是否使用单引号
  semi: true, // 行位是否使用分号
  trailingComma: "all", // 对于 ES5 而言, 尾逗号不能用于函数参数，因此使用它们只能用于数组
  bracketSpacing: true, // 是否保留括号中的空格 默认true
};

const commitlintrc = {
  extends: ["@commitlint/config-conventional"],
};

const commitEnum = {
  feat: {
    description: "A new feature",
    title: "Features",
    emoji: "✨",
  },
  fix: {
    description: "A bug fix",
    title: "Bug Fixes",
    emoji: "🐛",
  },
  docs: {
    description: "Documentation only changes",
    title: "Documentation",
    emoji: "📚",
  },
  style: {
    description:
      "Changes that do not affect the meaning of the code (white-space, formatting, etc)",
    title: "Styles",
    emoji: "💎",
  },
  refactor: {
    description: "A code change that neither fixes a bug nor adds a feature",
    title: "Code Refactoring",
    emoji: "📦",
  },
  perf: {
    description: "A code change that improves performance",
    title: "Performance Improvements",
    emoji: "🚀",
  },
  test: {
    description: "Adding missing tests or correcting existing tests",
    title: "Tests",
    emoji: "🚨",
  },
  build: {
    description:
      "Changes that affect the build system or external dependencies (example scopes: gulp, npm)",
    title: "Builds",
    emoji: "🛠",
  },
  ci: {
    description:
      "Changes to our CI configuration files and scripts (example scopes: Travis, Circle)",
    title: "Continuous Integrations",
    emoji: "⚙️",
  },
  chore: {
    description: "Other changes that don't modify src or test files",
    title: "Chores",
    emoji: "♻️",
  },
  revert: {
    description: "Reverts a previous commit",
    title: "Reverts",
    emoji: "🗑",
  },
};

const types = Object.keys(commitEnum).map((key) => {
  const { title, emoji } = commitEnum[key];
  return { type: key, section: [emoji, title].join(" ") };
});

const releaseitrc = {
  plugins: {
    "@release-it/conventional-changelog": {
      // 手动选择版本
      ignoreRecommendedBump: "true",
      // 生成修改历史
      infile: "CHANGELOG.md",
      // 生成修改历史头信息
      header: "# Changelog (修改历史)",
      // 设置修改历史要记录的 Git 提交信息
      preset: {
        name: "conventionalcommits",
        types: types,
      },
    },
  },
  git: {
    commitMessage: "chore: release v${version}",
  },
};

function lintstagedrc(eslint, prettier) {
  const js = ["js", "jsx", "mjs", "cjs", "ts", "tsx", "vue"];
  const css = ["css", "less", "scss", "sass"];
  const other = ["html", "md", "json"];
  const json = {};
  if (eslint) {
    json[`*.{${js.join()}}`] = "eslint --fix";
  }
  if (prettier) {
    const files = [...js, ...css, ...other];
    json[`*.{${files.join()}}`] = "prettier --write";
  }
  return json;
}

function writeFile(content, filename) {
  const res = spawn("echo", [content], { stdio: "pipe" });
  res.stdout.pipe(fs.createWriteStream(filename));
}

function writeJsonFile(json, filename) {
  const str = JSON.stringify(json, null, "  ");
  writeFile(str, filename);
}

const questions = [
  {
    type: "confirm",
    name: "husky",
    message: "install husky",
    default: true,
  },
  {
    type: "confirm",
    name: "eslint",
    message: "install eslint",
    default: true,
  },
  {
    type: "confirm",
    name: "prettier",
    message: "install prettier",
    default: true,
  },
  {
    type: "confirm",
    name: "lintStaged",
    message: "install lint-staged",
    default: true,
  },
  {
    type: "confirm",
    name: "commitizen",
    message: "install commitizen&commitlint ?",
    default: true,
  },
  {
    type: "confirm",
    name: "releaseIt",
    message: "install release-it",
    default: true,
  },
];

const task = inquirer.prompt(questions);

task.then((answers) => {
  if (answers.husky) {
    spawnSync("pnpm", ["add", "--save-dev", "husky"], cmd);
    spawnSync("pnpm", ["husky", "install"], cmd);
    spawnSync("pnpm", ["pkg", "set", "scripts.prepare=husky install"]);
  }

  if (answers.eslint) {
    spawnSync("pnpm", ["create", "@eslint/config"], cmd);
  }

  if (answers.prettier) {
    spawnSync("pnpm", ["add", "--save-dev", "prettier"], cmd);
    writeJsonFile(prettierrc, prettierrcFile);
  }

  if (answers.lintStaged) {
    const eslint = answers.eslint || goodreporc.eslint;
    const prettier = answers.prettier || goodreporc.prettier;
    writeJsonFile(lintstagedrc(eslint, prettier), lintstagedrcFile);
    spawnSync("pnpm", ["add", "--save-dev", "lint-staged"], cmd);
    spawnSync("pnpm", ["pkg", "set", "scripts.lint=lint-staged"], cmd);
    if (answers.husky || goodreporc.husky) {
      // prettier-ignore
      spawnSync("pnpm", ["husky", "set", ".husky/pre-commit", "pnpm run lint"], cmd);
    }
  }

  if (answers.commitizen) {
    spawnSync("pnpm", ["add", "--save-dev", "@commitlint/cli"], cmd);
    spawnSync("pnpm", ["add", "--save-dev", "@commitlint/cz-commitlint"], cmd);
    // prettier-ignore
    spawnSync("pnpm", ["add", "--save-dev", "@commitlint/config-conventional"], cmd);
    spawnSync("pnpm", ["add", "--save-dev", "commitizen"], cmd);
    spawnSync("pnpm", ["add", "--save-dev", "inquirer@8.2.6"], cmd);

    writeJsonFile(czrc, czrcFile);
    writeJsonFile(commitlintrc, commitlintrcFile);

    if (answers.husky || goodreporc.husky) {
      // prettier-ignore
      spawnSync("pnpm", ["husky", "set", ".husky/commit-msg", "npx --no -- commitlint --edit ${1}"], cmd);
      // prettier-ignore
      spawnSync("pnpm", ["husky", "set", ".husky/prepare-commit-msg", "exec < /dev/tty && node_modules/.bin/cz --hook || true"], cmd);
      spawnSync("pnpm", ["pkg", "set", "scripts.commit=git commit"], cmd);
    } else {
      spawnSync("pnpm", ["pkg", "set", "scripts.commit=cz"], cmd);
    }
  }

  if (answers.releaseIt) {
    writeJsonFile(releaseitrc, releaseitrcFile);
    spawnSync("pnpm", ["add", "--save-dev", "release-it"], cmd);
    // prettier-ignore
    spawnSync("pnpm", ["add", "--save-dev", "@release-it/conventional-changelog"], cmd);
    // prettier-ignore
    spawnSync("pnpm", ["pkg", "set", "scripts.release=HUSKY=0 release-it"], cmd );
  }

  const json = {
    husky: answers.husky || goodreporc.husky || false,
    eslint: answers.eslint || goodreporc.eslint || false,
    prettier: answers.prettier || goodreporc.prettier || false,
    lintStaged: answers.lintStaged || goodreporc.lintStaged || false,
    commitizen: answers.commitizen || goodreporc.commitizen || false,
    releaseIt: answers.releaseIt || goodreporc.releaseIt || false,
  };

  // console.log(json);

  writeJsonFile(json, goodreporcFile);
});
