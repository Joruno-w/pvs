import { readFile } from 'node:fs/promises';
import shell from 'shelljs';
import c from 'kleur';
import { findUp, pathExistsSync } from 'find-up';
import prompts from 'prompts';

const getFullPath = async (name, type = "file") => {
  const pkgPath = await findUp(name, { type });
  return pathExistsSync(pkgPath) ? pkgPath : "";
};
const install = (projectPath, name, version) => {
  const agent = pathExistsSync(`${projectPath}/pnpm-lock.yaml`) ? "pnpm" : "npm";
  shell.exec(`${agent} i ${name}@${version}`, { silent: true });
};
const updateProjectVersion = (projectPath, branch, version) => {
  if (shell.exec(`cd ${projectPath}`, { silent: true }).code !== 0) {
    shell.echo(c.red("\u8FDB\u5165\u9879\u76EE\u51FA\u9519"));
    shell.exit(1);
  }
  if (shell.exec(`git checkout ${branch}`).code !== 0) {
    shell.echo(c.red("\u5207\u6362\u5206\u652F\u51FA\u9519"));
    shell.exit(1);
  }
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
  if (shell.exec("git pull origin master", { silent: true }).code !== 0) {
    shell.echo(c.red("\u62C9\u53D6master\u4EE3\u7801\u51FA\u9519"));
    shell.exit(1);
  }
  if (shell.exec("git pull", { silent: true }).code !== 0) {
    shell.echo(c.red("\u62C9\u53D6\u4EE3\u7801\u51FA\u9519"));
    shell.exit(1);
  }
  install(projectPath, "@zz-yp/b2c-ui", version);
  if (shell.exec('git add . && git commit -m"feat: \u5347\u7EA7\u7EC4\u4EF6\u5E93" && git push').code !== 0) {
    shell.echo(c.red("git"));
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
    updateProjectVersion(projectPath, branch, version);
  }
};

export { pvs as cli };
