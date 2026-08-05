import { Repository } from "../core/Repository";

export function merge(targetBranch: string) {
    let repo = new Repository(process.cwd());
    repo.merge(targetBranch);
}
