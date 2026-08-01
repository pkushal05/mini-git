import path from "path";
import fs from "fs";
import { ObjectStore } from "../storage/ObjectStore";
import { Index } from "../storage/Index";
import { Tree } from "./Tree";
import { Commit } from "./Commit";

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
        const headDirPath = path.join(refsPath, "heads");
        const branchPath = path.join(headDirPath, "main");
        const headPath = path.join(gitPath, "HEAD");
        const indexPath = path.join(gitPath, "index");

        fs.mkdirSync(gitPath, { recursive: true });
        fs.mkdirSync(objectsPath, { recursive: true });
        fs.mkdirSync(refsPath, { recursive: true });
        fs.mkdirSync(headDirPath, { recursive: true });
        fs.writeFileSync(branchPath, "");
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

    updateHEAD(commithash: string): void {
        const headPath = path.join(
            this.rootPath,
            ".mgit",
            "refs",
            "heads",
            "main",
        );

        fs.writeFileSync(headPath, commithash);
    }

    getCurrentCommitHash(): string | null {
        const HEADPath = path.join(this.rootPath, ".mgit", "HEAD");
        const getCurrBranch = fs.readFileSync(HEADPath, "utf-8");
        const refPath = getCurrBranch.replace("ref: ", "").trim();

        const branchPath = path.join(this.rootPath, ".mgit", refPath);
        const commitHash = fs.readFileSync(branchPath, "utf-8").trim();

        if (commitHash === "") {
            return null;
        }

        return commitHash;
    }

    createTree(): string {
        if (!this.index) {
            throw new Error("Index does not exist");
        }

        if (!this.objectStore) {
            throw new Error("Objectstore does not exist");
        }
        const entries = this.index.read();

        const treeEntries = Object.entries(entries).map(([filename, hash]) => {
            return {
                name: filename,
                hash: hash,
                type: "blob" as const,
            };
        });

        const tree = new Tree(treeEntries);
        const serializedTree = tree.serialize();
        const treeHash = this.objectStore.save(serializedTree);

        return treeHash;
    }

    commit(message: string): string {
        if (!this.objectStore) {
            throw new Error("Objectstore does not exist");
        }

        const treeHash = this.createTree();
        let parentHash = this.getCurrentCommitHash();

        const commit = new Commit(treeHash, parentHash, message);
        const serializedCommit = commit.serialize();

        const commitHash = this.objectStore.save(serializedCommit);

        this.updateHEAD(commitHash);

        return commitHash;
    }
}
