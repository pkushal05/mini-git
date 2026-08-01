import { Repository } from "../core/Repository";

export function add(filePath: string) {
    let repo = new Repository(process.cwd());
    repo.add(filePath);
}
