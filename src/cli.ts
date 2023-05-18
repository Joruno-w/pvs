import shell from "shelljs";
import c from "kleur";
import { findUp, pathExistsSync } from "find-up";
import { readFile } from "node:fs/promises";

// detect git command exists
if (!shell.which("git")) {
  shell.echo(c.red("git command not found"));
  shell.exit(1);
}

// detect git access
if (shell.exec("git push").code !== 0) {
  shell.echo(c.red("git access denied"));
  shell.exit(1);
}

// search projects & get project full path
const getFullPath = async (
  name: string,
  type: "file" | "directory" = "file"
) => {
  const pkgPath = (await findUp(name, { type })) as string;
  return pathExistsSync(pkgPath) ? pkgPath : "";
};

// install
const install = (projectPath: string) => {
  const agent = pathExistsSync(`${projectPath}/pnpm-lock.yaml`)
    ? "pnpm"
    : "npm";
  shell.exec(`cd ${projectPath} && ${agent} i`);
};

const pvs = async () => {
  const pkgPath = await getFullPath("package.json");
  const { version, branches } = JSON.parse(
    await readFile(pkgPath, { encoding: "utf-8" })
  );
  for await (const [project, branch] of Object.entries(branches)) {
    if (!branch) continue;
    // find all project @zz-yp/b2c-ui version
    const projectPath = await getFullPath(project, "directory");
    const { dependencies } = JSON.parse(
      await readFile(`${projectPath}/package.json`, { encoding: "utf-8" })
    );
    const b2cUiVersion = dependencies["@zz-yp/b2c-ui"];
    if (version == b2cUiVersion) continue;
    // check working tree is clean
    const { stdout: statusStdout = [] } = shell.exec(`git status --porcelain`, {
      silent: true,
    });
    if (statusStdout.length > 0) {
      shell.echo(
        c.red(
          "Git当前工作区状态不是 clean，请确认！或者通过加 GIT_CHECK=none 环境变量跳过检查！"
        )
      );
      shell.exit(1);
    }
    // pull origin
    if (shell.exec("git pull origin master").code !== 0) {
      shell.exit(1);
    }
    if (shell.exec("git pull").code !== 0) {
      shell.exit(1);
    }
    // install
    install(projectPath);
    // push
    if (shell.exec("git push").code !== 0) {
      shell.echo(c.red("git access denied"));
      shell.exit(1);
    }
  }
};

module.exports = pvs;
export default pvs;