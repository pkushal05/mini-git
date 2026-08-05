import { Repository } from "../core/Repository";

export function createBranch(branchName: string) {
    let repo = new Repository(process.cwd());
    repo.createBranch(branchName);
}
