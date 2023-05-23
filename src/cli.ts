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
const install = (projectPath, name, version) => {
  const agent = pathExistsSync(`${projectPath}/pnpm-lock.yaml`) ? 'pnpm' : 'npm'
  spinner = ora('正在安装新版组件库...').start()
  const res = shell.exec(`cd ${projectPath} && ${agent} i ${name}@${version}`, {
    silent: true,
    async: true,
  })
  return res
}

// 更新所有工程的组件库版本
const updateProjectVersion = (projectPath, branch, version) => {
  // 切换到指定分支
  if (shell.exec(`cd ${projectPath} && git checkout ${branch}`).code !== 0) {
    shell.echo(c.red('切换分支出错'))
    shell.exit(1)
  }

  // 检查git当前工作区状态是否干净
  const { stdout: statusStdout = [] } = shell.exec(`cd ${projectPath} && git status --porcelain`, {
    silent: true,
  })
  if (statusStdout.length > 0) {
    shell.echo(
      c.red('Git当前工作区状态不是 clean，请确认！或者通过加 GIT_CHECK=none 环境变量跳过检查！')
    )
    shell.exit(1)
  }

  // 拉取远程代码
  if (shell.exec(`cd ${projectPath} && git pull origin master`, { silent: true }).code !== 0) {
    shell.echo(c.red('拉取master代码出错'))
    shell.exit(1)
  }

  if (shell.exec(`cd ${projectPath} && git pull`, { silent: true }).code !== 0) {
    shell.echo(c.red('拉取代码出错'))
    shell.exit(1)
  }

  // 安装新版组件库
  const { stdout } = install(projectPath, '@zz-yp/b2c-ui', version)
  let flag = true
  stdout.on('data', function (data) {
    if (data.includes('@zz-yp/b2c-ui') && flag) {
      flag = false
      spinner.succeed(c.green('安装完毕'))
      // 推送
      const { stdout: st } = shell.exec(
        `cd ${projectPath} && git add . && git commit -m"feat: 升级组件库" && git push`,
        {
          silent: true,
          async: true,
        }
      )
      st.on('data', () => {
        shell.echo(c.green('推送成功!'))
      })
    }
  })
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

// 版本同步(pkg version sync)
const pvs = async () => {
  valiate()
  const { version, branches } = pkg
  const { upgrade } = await prompts({
    type: 'confirm',
    name: 'upgrade',
    message: '你确定要更新关联的所有工程吗?',
  })
  if (!upgrade || !branches) process.exit(0)
  for (const [project, branch] of Object.entries(branches)) {
    if (!branch) continue
    const projectPath = await getFullPath(project)
    if (!projectPath) continue
    const { dependencies } = JSON.parse(
      await readFile(`${projectPath}/package.json`, { encoding: 'utf-8' })
    )
    const b2cUiVersion = dependencies['@zz-yp/b2c-ui']
    if (version.replace('^', '') === b2cUiVersion.replace('^', '')) {
      shell.echo(c.green(`🦄️ 在${branch}分支上,@zz-yp/b2c-ui已升级到了最新版本,跳过更新流程`))
      continue
    }
    updateProjectVersion(projectPath, branch, version)
  }
}

export default pvs
