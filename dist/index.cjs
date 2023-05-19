'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const promises = require('node:fs/promises');
const shell = require('shelljs');
const c = require('kleur');
const findUp = require('find-up');
const prompts = require('prompts');
const fs = require('node:fs');
const node_path = require('node:path');
const node_url = require('node:url');
const node_child_process = require('node:child_process');
const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e["default"] : e; }

const shell__default = /*#__PURE__*/_interopDefaultLegacy(shell);
const c__default = /*#__PURE__*/_interopDefaultLegacy(c);
const prompts__default = /*#__PURE__*/_interopDefaultLegacy(prompts);
const fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
const git__default = /*#__PURE__*/_interopDefaultLegacy(git);
const http__default = /*#__PURE__*/_interopDefaultLegacy(http);

const getFullPath = async (name, type = "file") => {
  const pkgPath = await findUp.findUp(name, { type });
  return findUp.pathExistsSync(pkgPath) ? pkgPath : "";
};
const install = (projectPath) => {
  const agent = findUp.pathExistsSync(`${projectPath}/pnpm-lock.yaml`) ? "pnpm" : "npm";
  shell__default.exec(`${agent} i`);
};
const updateProjectVersion = (projectPath, branch) => {
  if (shell__default.exec(`cd ${projectPath}`).code !== 0)
    shell__default.exit(1);
  if (shell__default.exec(`git checkout ${branch}`).code !== 0)
    shell__default.exit(1);
  const { stdout: statusStdout = [] } = shell__default.exec("git status --porcelain", {
    silent: true
  });
  if (statusStdout.length > 0) {
    shell__default.echo(
      c__default.red(
        "Git\u5F53\u524D\u5DE5\u4F5C\u533A\u72B6\u6001\u4E0D\u662F clean\uFF0C\u8BF7\u786E\u8BA4\uFF01\u6216\u8005\u901A\u8FC7\u52A0 GIT_CHECK=none \u73AF\u5883\u53D8\u91CF\u8DF3\u8FC7\u68C0\u67E5\uFF01"
      )
    );
    shell__default.exit(1);
  }
  if (shell__default.exec("git pull origin master").code !== 0)
    shell__default.exit(1);
  if (shell__default.exec("git pull").code !== 0)
    shell__default.exit(1);
  install(projectPath);
  if (shell__default.exec('git add . && git commit -m"feat: \u5347\u7EA7\u7EC4\u4EF6\u5E93" && git push').code !== 0) {
    shell__default.echo(c__default.red("git access denied"));
    shell__default.exit(1);
  }
};
const valiate = () => {
  if (!shell__default.which("git")) {
    shell__default.echo(c__default.red("git command not found"));
    shell__default.exit(1);
  }
  if (shell__default.exec("git push", { silent: true }).code !== 0) {
    shell__default.echo(c__default.red("git access denied"));
    shell__default.exit(1);
  }
};
const pvs = async () => {
  valiate();
  const pkgPath = await getFullPath("package.json");
  const { version, branches } = JSON.parse(
    await promises.readFile(pkgPath, { encoding: "utf-8" })
  );
  const { upgrade } = await prompts__default({
    type: "confirm",
    name: "upgrade",
    message: "Do you want to upgrade the associated projects ?"
  });
  if (!upgrade || !branches)
    process.exit(0);
  for await (const [project, branch] of Object.entries(branches)) {
    if (!branch)
      continue;
    const projectPath = await getFullPath(project, "directory");
    if (!projectPath)
      continue;
    const { dependencies } = JSON.parse(
      await promises.readFile(`${projectPath}/package.json`, { encoding: "utf-8" })
    );
    const b2cUiVersion = dependencies["@zz-yp/b2c-ui"];
    if (version === b2cUiVersion)
      continue;
    updateProjectVersion(projectPath, branch);
  }
};
module.exports = pvs;

const author = (() => {
  const name = node_child_process.execSync("git config --global user.name");
  const email = node_child_process.execSync("git config --global user.email");
  return {
    name: name?.toString("utf-8").replace(/\s/g, "") || "",
    email: email?.toString("utf-8").replace(/\s/g, "") || ""
  };
})();
const createBranch = async (dir, branchName) => {
  await git__default.checkout({
    fs: fs__default,
    dir,
    ref: "master"
  });
  await git__default.pull({
    fs: fs__default,
    http: http__default,
    dir,
    ref: "master",
    singleBranch: true
  });
  await git__default.branch({ fs: fs__default, dir, ref: branchName });
  await git__default.checkout({
    fs: fs__default,
    dir,
    ref: branchName
  });
};
const processBranches = async (dir, branchName) => {
  const currentBranch = await git__default.currentBranch({
    fs: fs__default,
    dir,
    fullname: false
  });
  const localbranches = await git__default.listBranches({ fs: fs__default, dir });
  const remoteBranches = await git__default.listBranches({
    fs: fs__default,
    dir,
    remote: "origin"
  });
  if (currentBranch !== branchName) {
    if (localbranches.includes(branchName) && remoteBranches.includes(branchName)) {
      await git__default.checkout({
        fs: fs__default,
        dir,
        ref: branchName
      });
    } else {
      if (!remoteBranches.includes(branchName))
        console.error(`\u4F60\u8FD8\u6CA1\u5728beetle\u4E0A\u521B\u5EFA ${branchName} \u5206\u652F\u54E6\uFF5E`);
      else
        createBranch(dir, branchName);
    }
  }
};
const getKitVersion = async (dir, kitName) => {
  const pkgPath = `${dir}/package.json`;
  const pkg = JSON.parse(fs__default.readFileSync(pkgPath, "utf-8"));
  return pkg?.dependencies?.[kitName] || "";
};
const setKitVersion = async (dir, kitName, version) => {
  if (await getKitVersion(dir, kitName) === version)
    return;
  const pkgPath = `${dir}/package.json`;
  const pkg = JSON.parse(fs__default.readFileSync(pkgPath, "utf-8"));
  pkg.dependencies[kitName] = version;
  fs__default.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
};
const pushBranches = async (dir, branchName) => {
  await git__default.add({ fs: fs__default, dir, filepath: "." });
  await git__default.commit({
    fs: fs__default,
    dir,
    author,
    message: "feat: \u5347\u7EA7\u7EC4\u4EF6\u5E93"
  });
  await git__default.push({
    fs: fs__default,
    http: http__default,
    dir,
    remote: "origin",
    ref: branchName,
    onAuth: () => ({ username: "oauth2", password: "xGh_PG8cbgTNwyg5WPhT" })
  });
};
const init = (config, name = "@zz-yp/b2c-ui") => {
  Object.entries(config).forEach(async ([projectName, branchName]) => {
    const __dirname = node_path.resolve(node_url.fileURLToPath((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('index.cjs', document.baseURI).href))), "../");
    const version = JSON.parse(
      fs__default.readFileSync(
        `${__dirname}/b2c_public_components/package.json`,
        "utf-8"
      )
    ).version;
    const dir = `${__dirname}/${projectName}`;
    await processBranches(dir, branchName);
    await setKitVersion(dir, name, version);
    await pushBranches(dir, branchName);
  });
};

exports.cli = pvs;
exports.git = init;
