import { Repository } from "../core/Repository";

export function status() {
    let repo = new Repository(process.cwd());

    repo.status();
}
