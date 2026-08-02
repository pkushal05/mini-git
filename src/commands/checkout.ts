import { Repository } from "../core/Repository";

export function checkout(commitHash: string) {
    let repo = new Repository(process.cwd());

    repo.checkout(commitHash);
}
