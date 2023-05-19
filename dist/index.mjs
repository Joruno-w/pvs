import { readFile } from 'node:fs/promises';
import shell from 'shelljs';
import c from 'kleur';
import { findUp, pathExistsSync } from 'find-up';
import prompts from 'prompts';
import fs from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';

const getFullPath = async (name, type = "file") => {
  const pkgPath = await findUp(name, { type });
  return pathExistsSync(pkgPath) ? pkgPath : "";
};
const install = (projectPath) => {
  const agent = pathExistsSync(`${projectPath}/pnpm-lock.yaml`) ? "pnpm" : "npm";
  shell.exec(`${agent} i`);
};
const updateProjectVersion = (projectPath, branch) => {
  if (shell.exec(`cd ${projectPath}`).code !== 0)
    shell.exit(1);
  if (shell.exec(`git checkout ${branch}`).code !== 0)
    shell.exit(1);
  const { stdout: statusStdout = [] } = shell.exec("git status --porcelain", {
    silent: true
  });
  if (statusStdout.length > 0) {
    shell.echo(
      c.red(
        "Git\u5F53\u524D\u5DE5\u4F5C\u533A\u72B6\u6001\u4E0D\u662F clean\uFF0C\u8BF7\u786E\u8BA4\uFF01\u6216\u8005\u901A\u8FC7\u52A0 GIT_CHECK=none \u73AF\u5883\u53D8\u91CF\u8DF3\u8FC7\u68C0\u67E5\uFF01"
      )
    );
    shell.exit(1);
  }
  if (shell.exec("git pull origin master").code !== 0)
    shell.exit(1);
  if (shell.exec("git pull").code !== 0)
    shell.exit(1);
  install(projectPath);
  if (shell.exec('git add . && git commit -m"feat: \u5347\u7EA7\u7EC4\u4EF6\u5E93" && git push').code !== 0) {
    shell.echo(c.red("git access denied"));
    shell.exit(1);
  }
};
const valiate = () => {
  if (!shell.which("git")) {
    shell.echo(c.red("git command not found"));
    shell.exit(1);
  }
  if (shell.exec("git push", { silent: true }).code !== 0) {
    shell.echo(c.red("git access denied"));
    shell.exit(1);
  }
};
const pvs = async () => {
  valiate();
  const pkgPath = await getFullPath("package.json");
  const { version, branches } = JSON.parse(
    await readFile(pkgPath, { encoding: "utf-8" })
  );
  const { upgrade } = await prompts({
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
      await readFile(`${projectPath}/package.json`, { encoding: "utf-8" })
    );
    const b2cUiVersion = dependencies["@zz-yp/b2c-ui"];
    if (version === b2cUiVersion)
      continue;
    updateProjectVersion(projectPath, branch);
  }
};

const author = (() => {
  const name = execSync("git config --global user.name");
  const email = execSync("git config --global user.email");
  return {
    name: name?.toString("utf-8").replace(/\s/g, "") || "",
    email: email?.toString("utf-8").replace(/\s/g, "") || ""
  };
})();
const createBranch = async (dir, branchName) => {
  await git.checkout({
    fs,
    dir,
    ref: "master"
  });
  await git.pull({
    fs,
    http,
    dir,
    ref: "master",
    singleBranch: true
  });
  await git.branch({ fs, dir, ref: branchName });
  await git.checkout({
    fs,
    dir,
    ref: branchName
  });
};
const processBranches = async (dir, branchName) => {
  const currentBranch = await git.currentBranch({
    fs,
    dir,
    fullname: false
  });
  const localbranches = await git.listBranches({ fs, dir });
  const remoteBranches = await git.listBranches({
    fs,
    dir,
    remote: "origin"
  });
  if (currentBranch !== branchName) {
    if (localbranches.includes(branchName) && remoteBranches.includes(branchName)) {
      await git.checkout({
        fs,
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
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  return pkg?.dependencies?.[kitName] || "";
};
const setKitVersion = async (dir, kitName, version) => {
  if (await getKitVersion(dir, kitName) === version)
    return;
  const pkgPath = `${dir}/package.json`;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  pkg.dependencies[kitName] = version;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
};
const pushBranches = async (dir, branchName) => {
  await git.add({ fs, dir, filepath: "." });
  await git.commit({
    fs,
    dir,
    author,
    message: "feat: \u5347\u7EA7\u7EC4\u4EF6\u5E93"
  });
  await git.push({
    fs,
    http,
    dir,
    remote: "origin",
    ref: branchName,
    onAuth: () => ({ username: "oauth2", password: "xGh_PG8cbgTNwyg5WPhT" })
  });
};
const init = (config, name = "@zz-yp/b2c-ui") => {
  Object.entries(config).forEach(async ([projectName, branchName]) => {
    const __dirname = resolve(fileURLToPath(import.meta.url), "../");
    const version = JSON.parse(
      fs.readFileSync(
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

export { pvs as cli, init as git };
