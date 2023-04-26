import fs from "node:fs";
import http from "isomorphic-git/http/node";
import git from "isomorphic-git";

const path = "../zhuanzhuan";

const config = {
  zlj_price_comparison_h5: "zlj_price_comparison_h5-feature-2879-26",
};

const version = JSON.parse(
  fs.readFileSync(`${path}/b2c_public_components/package.json`, "utf-8")
).version;

const pullBranch = async (dir: string, branchName: string): Promise<void> => {
  try {
    await git.pull({
      fs,
      http,
      dir,
      ref: branchName,
      singleBranch: true,
    });
    await git.pull({
      fs,
      http,
      dir,
      ref: "master",
      singleBranch: true,
    });
  } catch (e) {
    console.error("代码有冲突哦!");
  }
};

const createBranch = async (dir: string, branchName: string) => {
  await git.checkout({
    fs,
    dir,
    ref: "master",
  });
  await git.pull({
    fs,
    http,
    dir,
    ref: "master",
    singleBranch: true,
  });
  await git.branch({ fs, dir, ref: branchName });
  await git.checkout({
    fs,
    dir,
    ref: branchName,
  });
};

const processBranches = async (dir: string, branchName: string) => {
  const currentBranch = await git.currentBranch({
    fs,
    dir,
    fullname: false,
  });
  const localbranches = await git.listBranches({ fs, dir });
  const remoteBranches = await git.listBranches({
    fs,
    dir,
    remote: "origin",
  });
  if (currentBranch != branchName) {
    if (
      localbranches.includes(branchName) &&
      remoteBranches.includes(branchName)
    ) {
      await git.checkout({
        fs,
        dir,
        ref: branchName,
      });
    } else {
      if (!remoteBranches.includes(branchName)) {
        console.error("你还没在beetle上创分支哦～");
      } else {
        createBranch(dir, branchName);
      }
    }
  }
};

const getKitVersion = async (dir: string, kitName: string) => {
  const pkgPath = `${dir}/package.json`;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  return pkg?.dependencies?.[kitName] || "";
};

const setKitVersion = async (dir: string, kitName: string, version: string) => {
  const pkgPath = `${dir}/package.json`;
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  pkg.dependencies[kitName] = version;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
};

const pushBranches = async (dir: string, branchName: string) => {
  await git.add({ fs, dir, filepath: "." });
  let sha = await git.commit({
    fs,
    dir,
    author: {
      name: "Mr. Test",
      email: "mrtest@example.com",
    },
    message: "Added the a.txt file",
  });
  const pushResult = await git.push({
    fs,
    http,
    dir,
    remote: "origin",
    ref: branchName,
  });
  console.log(pushResult);
};

Object.entries(config).forEach(async ([projectName, branchName]) => {
  const dir = `${path}/${projectName}`;
  // 处理分支
  await processBranches(dir, branchName);
  // 修改版本
  await setKitVersion(dir, "@zz-yp/b2c-ui", version);
  // 推送分支
  // await pushBranches(dir, branchName);
});
