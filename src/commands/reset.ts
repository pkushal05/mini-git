import { Repository } from "../core/Repository";

export function executeResetHard(commitHash: string): void {

      let repo = new Repository(process.cwd());


      repo.resetHard(commitHash);
}
