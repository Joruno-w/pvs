const { readFile } = require("node:fs/promises");
const { resolve } = require("node:path");
const shell = require("shelljs");
const { pathExistsSync } = require("fs-extra");
const c = require("kleur");
const ora = require("ora");
const prompts = require("prompts");
const pkg = require("../package.json");
const getFullPath = async (name) => {
  const pkgPath = resolve(process.cwd(), `../${name}`);
  return pathExistsSync(pkgPath) ? pkgPath : "";
};
const install = (projectPath, name, version) => {
  const agent = pathExistsSync(`${projectPath}/pnpm-lock.yaml`) ? "pnpm" : "npm";
  const spinner = ora("Installing...").start();
  shell.exec(
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
  if (shell.exec(`cd ${projectPath} && git checkout ${branch}`).code !== 0) {
    shell.echo(c.red("\u5207\u6362\u5206\u652F\u51FA\u9519"));
    shell.exit(1);
  }
  const { stdout: statusStdout = [] } = shell.exec(`cd ${projectPath} && git status --porcelain`, {
    silent: true
  });
  if (statusStdout.length > 0) {
    shell.echo(
      c.red("Git\u5F53\u524D\u5DE5\u4F5C\u533A\u72B6\u6001\u4E0D\u662F clean\uFF0C\u8BF7\u786E\u8BA4\uFF01\u6216\u8005\u901A\u8FC7\u52A0 GIT_CHECK=none \u73AF\u5883\u53D8\u91CF\u8DF3\u8FC7\u68C0\u67E5\uFF01")
    );
    shell.exit(1);
  }
  if (shell.exec(`cd ${projectPath} && git pull origin master`, { silent: true }).code !== 0) {
    shell.echo(c.red("\u62C9\u53D6master\u4EE3\u7801\u51FA\u9519"));
    shell.exit(1);
  }
  if (shell.exec(`cd ${projectPath} && git pull`, { silent: true }).code !== 0) {
    shell.echo(c.red("\u62C9\u53D6\u4EE3\u7801\u51FA\u9519"));
    shell.exit(1);
  }
  install(projectPath, "@zz-yp/b2c-ui", version);
  if (shell.exec(`cd ${projectPath} && git add . && git commit -m"feat: \u5347\u7EA7\u7EC4\u4EF6\u5E93" && git push`).code !== 0) {
    shell.echo(c.red("\u63D0\u4EA4\u4EE3\u7801\u51FA\u9519"));
    shell.exit(1);
  }
};
const valiate = () => {
  if (!shell.which("git")) {
    shell.echo(c.red("git\u547D\u4EE4\u4E0D\u5B58\u5728"));
    shell.exit(1);
  }
  if (shell.exec("git push", { silent: true }).code !== 0) {
    shell.echo(c.red("git\u6743\u9650\u4E0D\u5B58\u5728"));
    shell.exit(1);
  }
};
const pvs = async () => {
  valiate();
  const { version, branches } = pkg;
  const { upgrade } = await prompts({
    type: "confirm",
    name: "upgrade",
    message: "Do you want to upgrade the associated projects ?"
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
      await readFile(`${projectPath}/package.json`, { encoding: "utf-8" })
    );
    const b2cUiVersion = dependencies["@zz-yp/b2c-ui"];
    if (version === b2cUiVersion)
      continue;
    updateProjectVersion(projectPath, branch, version);
  }
};
module.exports = pvs;

export { pvs as cli };
