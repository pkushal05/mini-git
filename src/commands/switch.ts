import { Repository } from "../core/Repository";

export function switchBranch(branchName: string) {
    let repo = new Repository(process.cwd());
    repo.switchBranch(branchName);
}
