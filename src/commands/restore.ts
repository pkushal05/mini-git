import { Repository } from "../core/Repository";

export function restoreFromHead(fileName: string) {
    let repo = new Repository(process.cwd());
    repo.restoreSourceHead(fileName);
}

export function restoreFromIndex(fileName: string) {
    let repo = new Repository(process.cwd());
    repo.restoreSourceIndex(fileName);
}
