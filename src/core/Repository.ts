import path from "path";
import fs from "fs";
import { ObjectStore } from "../storage/ObjectStore";
import { Index } from "../storage/Index";

export class Repository {
    private objectStore?: ObjectStore;
    private index?: Index;

    constructor(private rootPath: string) {
        const objectsPath = path.join(this.rootPath, ".mgit", "objects");
        const indexPath = path.join(this.rootPath, ".mgit", "index");

        this.objectStore = new ObjectStore(objectsPath);
        this.index = new Index(indexPath);
    }

    init() {
        const gitPath = path.join(this.rootPath, ".mgit");

        if (fs.existsSync(gitPath)) {
            throw new Error("Mini Git repository already exists");
        }

        const objectsPath = path.join(gitPath, "objects");
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

    add(filePath: string): void {
        const content = fs.readFileSync(filePath, "utf-8");

        const blobHash = this.createBlobObject(content);
        this.index?.add(filePath, blobHash);
    }

    createBlobObject(content: string): string {
        if (!this.objectStore) {
            throw new Error("ObjectStore does not exist");
        }

        return this.objectStore.save(content);
    }
}
