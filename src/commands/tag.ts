import { Repository } from "../core/Repository";

export function createTag(tagName: string) {
    let repo = new Repository(process.cwd());
    repo.createTag(tagName);
}
