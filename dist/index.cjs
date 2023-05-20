'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const node_fs = require('node:fs');
const node_path = require('node:path');
const shell = require('shelljs');
const c = require('kleur');
const ora = require('ora');
const prompts = require('prompts');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e["default"] : e; }

const shell__default = /*#__PURE__*/_interopDefaultLegacy(shell);
const c__default = /*#__PURE__*/_interopDefaultLegacy(c);
const ora__default = /*#__PURE__*/_interopDefaultLegacy(ora);
const prompts__default = /*#__PURE__*/_interopDefaultLegacy(prompts);

const name = "pvs";
const type = "module";
const version = "1.0.16";
const packageManager = "pnpm@7.9.5";
const description = "";
const author = "Joruno-w <1710642275@qq.com>";
const license = "MIT";
const homepage = "https://github.com/Joruno-w/auto-git#readme";
const repository = {
	type: "git",
	url: "git+https://github.com/Joruno-w/auto-git.git"
};
const bugs = "https://github.com/Joruno-w/auto-git/issues";
const keywords = [
	"version",
	"sync"
];
const sideEffects = false;
const exports$1 = {
	".": {
		types: "./dist/index.d.ts",
		require: "./dist/index.cjs",
		"import": "./dist/index.mjs"
	}
};
const main = "./dist/index.mjs";
const module$1 = "./dist/index.mjs";
const types = "./dist/index.d.ts";
const typesVersions = {
	"*": {
		"*": [
			"./dist/*",
			"./dist/index.d.ts"
		]
	}
};
const files = [
	"dist"
];
const scripts = {
	build: "unbuild",
	dev: "unbuild --stub",
	lint: "eslint . --fix",
	release: "npm run build && bumpp && npm publish && esno ./changeVersion.ts",
	start: "esno src/index.ts",
	test: "vitest",
	pub: "npm publish"
};
const dependencies = {
	"@types/fs-extra": "^11.0.1",
	"@types/prompts": "^2.4.4",
	"@types/shelljs": "^0.8.12",
	"find-up": "^6.3.0",
	"fs-extra": "^11.1.1",
	"isomorphic-git": "^1.23.0",
	kleur: "^4.1.5",
	ora: "^6.3.1",
	prompts: "^2.4.2",
	shelljs: "^0.8.5"
};
const devDependencies = {
	"@antfu/eslint-config": "^0.37.0",
	"@types/node": "^18.7.5",
	bumpp: "^8.2.1",
	eslint: "^8.22.0",
	esno: "^0.16.3",
	pnpm: "^7.9.0",
	rimraf: "^3.0.2",
	typescript: "^4.7.4",
	unbuild: "^0.8.8",
	urpm: "^0.0.4",
	vite: "^3.0.7",
	vitest: "^0.22.0"
};
const eslintConfig = {
	"extends": "@antfu"
};
const pkg = {
	name: name,
	type: type,
	version: version,
	packageManager: packageManager,
	description: description,
	author: author,
	license: license,
	homepage: homepage,
	repository: repository,
	bugs: bugs,
	keywords: keywords,
	sideEffects: sideEffects,
	exports: exports$1,
	main: main,
	module: module$1,
	types: types,
	typesVersions: typesVersions,
	files: files,
	scripts: scripts,
	dependencies: dependencies,
	devDependencies: devDependencies,
	eslintConfig: eslintConfig
};

const getFullPath = async (name) => {
  const pkgPath = node_path.resolve(process.cwd(), `../${name}`);
  return node_fs.existsSync(pkgPath) ? pkgPath : "";
};
const install = (projectPath, name, version) => {
  const agent = node_fs.existsSync(`${projectPath}/pnpm-lock.yaml`) ? "pnpm" : "npm";
  const spinner = ora__default("Installing...").start();
  shell__default.exec(
    `cd ${projectPath} && ${agent} i ${name}@${version}`,
    {
      silent: true
    },
    (code, stdout, _) => {
      if (code === 0 && stdout.includes("up to date"))
        spinner.text = "Install finished";
      else
        spinner.text = "Install failed";
      spinner.stop();
    }
  );
};
const updateProjectVersion = (projectPath, branch, version) => {
  if (shell__default.exec(`cd ${projectPath} && git checkout ${branch}`).code !== 0) {
    shell__default.echo(c__default.red("\u5207\u6362\u5206\u652F\u51FA\u9519"));
    shell__default.exit(1);
  }
  const { stdout: statusStdout = [] } = shell__default.exec(
    `cd ${projectPath} && git status --porcelain`,
    {
      silent: true
    }
  );
  if (statusStdout.length > 0) {
    shell__default.echo(
      c__default.red(
        "Git\u5F53\u524D\u5DE5\u4F5C\u533A\u72B6\u6001\u4E0D\u662F clean\uFF0C\u8BF7\u786E\u8BA4\uFF01\u6216\u8005\u901A\u8FC7\u52A0 GIT_CHECK=none \u73AF\u5883\u53D8\u91CF\u8DF3\u8FC7\u68C0\u67E5\uFF01"
      )
    );
    shell__default.exit(1);
  }
  if (shell__default.exec(`cd ${projectPath} && git pull origin master`, { silent: true }).code !== 0) {
    shell__default.echo(c__default.red("\u62C9\u53D6master\u4EE3\u7801\u51FA\u9519"));
    shell__default.exit(1);
  }
  if (shell__default.exec(`cd ${projectPath} && git pull`, { silent: true }).code !== 0) {
    shell__default.echo(c__default.red("\u62C9\u53D6\u4EE3\u7801\u51FA\u9519"));
    shell__default.exit(1);
  }
  install(projectPath, "@zz-yp/b2c-ui", version);
  if (shell__default.exec(
    `cd ${projectPath} && git add . && git commit -m"feat: \u5347\u7EA7\u7EC4\u4EF6\u5E93" && git push`
  ).code !== 0) {
    shell__default.echo(c__default.red("\u63D0\u4EA4\u4EE3\u7801\u51FA\u9519"));
    shell__default.exit(1);
  }
};
const valiate = () => {
  if (!shell__default.which("git")) {
    shell__default.echo(c__default.red("git\u547D\u4EE4\u4E0D\u5B58\u5728"));
    shell__default.exit(1);
  }
  if (shell__default.exec("git push", { silent: true }).code !== 0) {
    shell__default.echo(c__default.red("git\u6743\u9650\u4E0D\u5B58\u5728"));
    shell__default.exit(1);
  }
};
const pvs = async () => {
  valiate();
  const { version, branches } = pkg;
  const { upgrade } = await prompts__default({
    type: "confirm",
    name: "upgrade",
    message: "\u4F60\u786E\u5B9A\u8981\u5347\u7EA7\u5173\u8054\u7684\u5DE5\u7A0B\u5417\uFF1F"
  });
  if (!upgrade || !branches)
    process.exit(0);
  for (const [project, branch] of Object.entries(branches)) {
    if (!branch)
      continue;
    const projectPath = await getFullPath(project);
    if (!projectPath)
      continue;
    const { dependencies } = JSON.parse(
      await node_fs.promises.readFile(`${projectPath}/package.json`, { encoding: "utf-8" })
    );
    const b2cUiVersion = dependencies["@zz-yp/b2c-ui"];
    if (version === b2cUiVersion)
      continue;
    updateProjectVersion(projectPath, branch, version);
  }
};

exports.cli = pvs;
