import { Repository } from "../core/Repository";

export function log() {
    const repo = new Repository(process.cwd());

    repo.log();
}
