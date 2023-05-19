import { readFile } from 'node:fs/promises'
import shell from 'shelljs'
import c from 'kleur'
import { findUp, pathExistsSync } from 'find-up'
import prompts from 'prompts'

interface B2C_PKG {
  version: string
  branches?: Record<string, `${string}-feature-${string}-${string}`>
  [key: string]: any
}

// search projects & get project full path
const getFullPath = async (
  name: string,
  type: 'file' | 'directory' = 'file',
) => {
  const pkgPath = (await findUp(name, { type })) as string
  return pathExistsSync(pkgPath) ? pkgPath : ''
}

// npm install
const install = (projectPath: string) => {
  const agent = pathExistsSync(`${projectPath}/pnpm-lock.yaml`)
    ? 'pnpm'
    : 'npm'
  shell.exec(`${agent} i`)
}

// update
const updateProjectVersion = (projectPath: string, branch: string) => {
  // change directory
  if (shell.exec(`cd ${projectPath}`).code !== 0)
    shell.exit(1)

  if (shell.exec(`git checkout ${branch}`).code !== 0)
    shell.exit(1)

  // check working tree is clean
  const { stdout: statusStdout = [] } = shell.exec('git status --porcelain', {
    silent: true,
  })
  if (statusStdout.length > 0) {
    shell.echo(
      c.red(
        'Git当前工作区状态不是 clean，请确认！或者通过加 GIT_CHECK=none 环境变量跳过检查！',
      ),
    )
    shell.exit(1)
  }
  // pull origin
  if (shell.exec('git pull origin master').code !== 0)
    shell.exit(1)

  if (shell.exec('git pull').code !== 0)
    shell.exit(1)

  // install
  install(projectPath)
  // push
  if (
    shell.exec('git add . && git commit -m"feat: 升级组件库" && git push')
      .code !== 0
  ) {
    shell.echo(c.red('git access denied'))
    shell.exit(1)
  }
}

// valiate
const valiate = () => {
  // detect git command exists
  if (!shell.which('git')) {
    shell.echo(c.red('git command not found'))
    shell.exit(1)
  }

  // detect git access
  if (shell.exec('git push', { silent: true }).code !== 0) {
    shell.echo(c.red('git access denied'))
    shell.exit(1)
  }
}

const pvs = async () => {
  valiate()
  const pkgPath = await getFullPath('package.json')
  const { version, branches } = JSON.parse(
    await readFile(pkgPath, { encoding: 'utf-8' }),
  ) as B2C_PKG
  const { upgrade } = await prompts({
    type: 'confirm',
    name: 'upgrade',
    message: 'Do you want to upgrade the associated projects ?',
  })
  if (!upgrade || !branches)
    process.exit(0)
  for await (const [project, branch] of Object.entries(branches)) {
    if (!branch)
      continue
    // find all project @zz-yp/b2c-ui version
    const projectPath = await getFullPath(project, 'directory')
    if (!projectPath)
      continue
    const { dependencies } = JSON.parse(
      await readFile(`${projectPath}/package.json`, { encoding: 'utf-8' }),
    )
    const b2cUiVersion = dependencies['@zz-yp/b2c-ui']
    if (version === b2cUiVersion)
      continue
    // update all project b2c-ui version
    updateProjectVersion(projectPath, branch)
  }
}

module.exports = pvs

export default pvs
