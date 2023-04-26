import fs from 'node:fs'
import git from 'isomorphic-git'
// Get the current branch name
let branch = await git.currentBranch({
  fs,
  dir: "/",
  fullname: false,
});
console.log(branch);
