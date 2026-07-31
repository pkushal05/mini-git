import path from "path";
import fs from "fs";
import { ObjectStore } from "../storage/ObjectStore";

export class Repository {
    private objectStore?: ObjectStore;

    constructor(private rootPath: string) {}

    init() {
        const gitPath = path.join(this.rootPath, ".mgit");

        if (fs.existsSync(gitPath)) {
            throw new Error("Mini Git repository already exists");
            return;
        }

        const objectsPath = path.join(gitPath, "objects");
        this.objectStore = new ObjectStore(objectsPath);

        const refsPath = path.join(gitPath, "refs");
        const headPath = path.join(gitPath, "HEAD");
        const indexPath = path.join(gitPath, "index");

        fs.mkdirSync(gitPath, { recursive: true });
        fs.mkdirSync(objectsPath, { recursive: true });
        fs.mkdirSync(refsPath, { recursive: true });
        fs.writeFileSync(headPath, "ref: refs/heads/main");
        fs.writeFileSync(indexPath, "");

        console.log("Initialized empty Mini Git repository.");
    }

    storeObject(content: string) {
        if (!this.objectStore) {
            throw new Error("ObjectStore does not exist");
        }

        const hash = this.objectStore.save(content);

        return hash;
    }
}
