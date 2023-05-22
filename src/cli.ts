import { existsSync, promises as fs } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import shell from 'shelljs'
import c from 'kleur'
import ora from 'ora'
import prompts from 'prompts'
import pkg from '../package.json'

// 查找工程并获得其绝对路径
const getFullPath = async (name: string) => {
  const pkgPath = resolve(fileURLToPath(import.meta.url), `../${name}`)
  return existsSync(pkgPath) ? pkgPath : ''
}

// 安装新版组件库
const install = (projectPath: any, name: string, version: any) => {
  const agent = existsSync(`${projectPath}/pnpm-lock.yaml`) ? 'pnpm' : 'npm'
  const spinner = ora('Installing...').start()
  shell.exec(
    `cd ${projectPath} && ${agent} i ${name}@${version}`,
    {
      silent: true,
    },
    (code: number, stdout: string | string[], _: any) => {
      // 判断命令是否执行完毕
      if (code === 0 && stdout.includes('up to date'))
        spinner.text = 'Install finished'
      else spinner.text = 'Install failed'

      spinner.stop()
    },
  )
}

// 更新所有工程的组件库版本
const updateProjectVersion = (
  projectPath: any,
  branch: unknown,
  version: any,
) => {
  if (shell.exec(`cd ${projectPath} && git checkout ${branch}`).code !== 0) {
    shell.echo(c.red('切换分支出错'))
    shell.exit(1)
  }

  // 检查git当前工作区状态是否干净
  const { stdout: statusStdout = [] } = shell.exec(
    `cd ${projectPath} && git status --porcelain`,
    {
      silent: true,
    },
  )
  if (statusStdout.length > 0) {
    shell.echo(
      c.red(
        'Git当前工作区状态不是 clean，请确认！或者通过加 GIT_CHECK=none 环境变量跳过检查！',
      ),
    )
    shell.exit(1)
  }

  // pull origin
  if (
    shell.exec(`cd ${projectPath} && git pull origin master`, { silent: true })
      .code !== 0
  ) {
    shell.echo(c.red('拉取master代码出错'))
    shell.exit(1)
  }

  if (
    shell.exec(`cd ${projectPath} && git pull`, { silent: true }).code !== 0
  ) {
    shell.echo(c.red('拉取代码出错'))
    shell.exit(1)
  }

  // install
  install(projectPath, '@zz-yp/b2c-ui', version)

  // push
  if (
    shell.exec(
      `cd ${projectPath} && git add . && git commit -m"feat: 升级组件库" && git push`,
    ).code !== 0
  ) {
    shell.echo(c.red('提交代码出错'))
    shell.exit(1)
  }
}

// 验证
const valiate = () => {
  // 检查git命令是否存在
  if (!shell.which('git')) {
    shell.echo(c.red('git命令不存在'))
    shell.exit(1)
  }

  // 检查git权限是否存在
  if (shell.exec('git push', { silent: true }).code !== 0) {
    shell.echo(c.red('git权限不存在'))
    shell.exit(1)
  }
}

// 版本同步（pkg version sync）
const pvs = async () => {
  valiate()
  const { version, branches } = pkg as any
  const { upgrade } = await prompts({
    type: 'confirm',
    name: 'upgrade',
    message: '你确定要升级关联的工程吗？',
  })
  if (!upgrade || !branches)
    process.exit(0)
  for (const [project, branch] of Object.entries(branches)) {
    if (!branch)
      continue
    const projectPath = await getFullPath(project)
    if (!projectPath)
      continue
    const { dependencies } = JSON.parse(
      await fs.readFile(`${projectPath}/package.json`, { encoding: 'utf-8' }),
    )
    const b2cUiVersion = dependencies['@zz-yp/b2c-ui']
    if (version === b2cUiVersion)
      continue
    updateProjectVersion(projectPath, branch, version)
  }
}

export default pvs
