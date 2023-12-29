# @pch1024/good-repo-cli

一个自动化配置项目中流程与规范的工具，配置内容包括 husky、eslint、prettier、lintStaged、commitizen、release-it 内容。

## 安装

```bash
# 全局安装
sudo npm i @pch1024/good-repo-cli -g
good-repo # 全局安装后使用

# 临时安装并使用
npx @pch1024/good-repo-cli good-repo
```

## 涉及改动文件

- 新增文件

```JS
// cli 文件
const goodreporcFile = path.join(cwd, ".goodreporc.json");

// 一些配置文件
const czrcFile = path.join(cwd, ".cz.json");
const commitlintrcFile = path.join(cwd, ".commitlintrc.json");
const lintstagedrcFile = path.join(cwd, ".lintstagedrc.json");
const releaseitrcFile = path.join(cwd, ".release-it.json");

// 其他
// .husky/*				# 由 husky 生成
// .eslintrc.json		# 由 eslint 生成
// CHANGELOG.md 		# 由 release-it 生成
```

- package.json

```json
// 可选的新增
"scripts": {
	"lint": "lint-staged",
	"prepare": "husky install",
	"commit": "git commit",
	"release": "HUSKY=0 release-it"
},
// 可选的新增
"devDependencies": {
    "@commitlint/cli": "^18.4.3",
    "@commitlint/config-conventional": "^18.4.3",
    "@commitlint/cz-commitlint": "^18.4.3",
    "@release-it/conventional-changelog": "^8.0.1",
    "@typescript-eslint/eslint-plugin": "^6.16.0",
    "@typescript-eslint/parser": "^6.16.0",
    "commitizen": "^4.3.0",
    "eslint": "^8.56.0",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0",
    "prettier": "^3.1.1",
    "release-it": "^17.0.1",
},
```

## 规范的开发流程

```bash
# 1 暂存文件
git add .

# 2 执行提交
git commit # 执行 husky 的 git hook（内部执行顺序：lint-staged、commitizen、commitlint）

# 3 发版

## 3.1 不需要发版
git push

## 3.2 需要发版
### 执行 HUSKY=0 release-it 命令
#### 内部执行顺序：
##### 1. 确认 NPM Publish 动作
##### 2. 确认 CommitMsg 信息
##### 3. 确认 GitTag 信息
##### 4. 确认 GitPush 动作
pnpm release
```
