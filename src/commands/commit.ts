import { Repository } from "../core/Repository";

export function commit(message: string) {
    let repo = new Repository(process.cwd());

    const commitHash = repo.commit(message);
    console.log(commitHash);
}
