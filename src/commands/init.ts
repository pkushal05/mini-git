import fs from "fs";
import path from "path";

export function init() {
    const gitPath = path.join(process.cwd(), ".mgit");

    if (fs.existsSync(gitPath)) {
        console.log("Mini Git repository already exists");
        return;
    }

    fs.mkdirSync(gitPath);

    console.log("Initialized empty Mini Git repository.");
}
