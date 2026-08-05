import path from "path";
import fs from "fs";
import { ObjectStore } from "../storage/ObjectStore";
import { Index } from "../storage/Index";
import { Tree } from "./Tree";
import { Commit } from "./Commit";
import { time } from "console";

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
        const tagsPath = path.join(refsPath, "tags");
        const headDirPath = path.join(refsPath, "heads");
        const branchPath = path.join(headDirPath, "main");
        const headPath = path.join(gitPath, "HEAD");
        const indexPath = path.join(gitPath, "index");

        fs.mkdirSync(gitPath, { recursive: true });
        fs.mkdirSync(objectsPath, { recursive: true });
        fs.mkdirSync(refsPath, { recursive: true });
        fs.mkdirSync(tagsPath, { recursive: true });
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

    updateCurrentBranch(commithash: string): void {
        const HEADPath = path.join(this.rootPath, ".mgit", "HEAD");
        const currentHEAD = fs.readFileSync(HEADPath, "utf-8");

        const refPath = currentHEAD.replace("ref: ", "").trim();

        const currentBranch = path.join(this.rootPath, ".mgit", refPath);

        fs.writeFileSync(currentBranch, commithash);
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

    getCurrentCommitTree(): string | null {
        if (!this.objectStore) {
            throw new Error("Objectstore does not exist");
        }
        const currentCommitHash = this.getCurrentCommitHash();

        if (!currentCommitHash) {
            return null;
        }

        const commitContent = this.objectStore.read(currentCommitHash);
        const commitObject = Commit.deserialize(commitContent);

        return commitObject.getTreeHash();
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

        this.updateCurrentBranch(commitHash);

        return commitHash;
    }

    log(): void {
        if (!this.objectStore) {
            throw new Error("Objectstore does not exist");
        }

        let currentCommitHash = this.getCurrentCommitHash();
        if (!currentCommitHash) {
            throw new Error("No commit history to log");
        }

        while (currentCommitHash) {
            const commitContent = this.objectStore.read(currentCommitHash);
            const commitObject = Commit.deserialize(commitContent);

            console.log();
            console.log("********************");
            console.log(`Commit: ${currentCommitHash}`);
            console.log(`Tree: ${commitObject.getTreeHash()}`);
            console.log(`Parent commit: ${commitObject.getParentHash()}`);
            console.log(`Message: ${commitObject.getMessage()}`);
            console.log(
                `Timestamp: ${commitObject.getTimestamp().toLocaleString()}`,
            );
            console.log("********************");
            console.log();

            currentCommitHash = commitObject.getParentHash();
        }
    }

    getIndexEntries(): Record<string, string> {
        if (!this.index) {
            throw new Error("Index is not initialized");
        }

        return this.index.read();
    }

    getCurrentTreeEntries(): Record<string, string> {
        if (!this.objectStore) {
            throw new Error("ObjectStore is not initialized");
        }
        const currentCommitTreeHash = this.getCurrentCommitTree();

        if (!currentCommitTreeHash) {
            throw new Error("Current commit does not have a tree");
        }

        const currentTreeContent = this.objectStore?.read(
            currentCommitTreeHash,
        );
        if (!currentTreeContent) {
            throw new Error("Tree Object not found");
        }
        const tree = Tree.deserialize(currentTreeContent);
        const treeEntries = tree.getEntries();

        const entries: Record<string, string> = {};

        for (const entry of treeEntries) {
            entries[entry.name] = entry.hash;
        }

        return entries;
    }

    compareTrees() {
        const headTreeEntries = this.getCurrentTreeEntries();
        const indexEntries = this.getIndexEntries();

        const changes: string[] = [];

        for (const fileName in headTreeEntries) {
            const headHash = headTreeEntries[fileName];
            const indexHash = indexEntries[fileName];

            if (!indexHash) {
                changes.push(`deleted: ${fileName}`);
            } else if (headHash !== indexHash) {
                changes.push(`modified: ${fileName}`);
            }
        }

        return changes;
    }

    compareWorkingDir() {
        if (!this.objectStore) {
            throw new Error("ObjectStore is not initialized");
        }

        const indexEntries = this.getIndexEntries();

        const changes: string[] = [];

        for (const fileName in indexEntries) {
            const stagedHash = indexEntries[fileName];
            const currentContent = fs.readFileSync(fileName, "utf8");

            const currentHash = this.objectStore.hash(currentContent);

            if (currentHash !== stagedHash) {
                changes.push(`modified: ${fileName}`);
            }
        }

        return changes;
    }

    status(): void {
        const stagedChanges = this.compareTrees();
        const unStagedChanges = this.compareWorkingDir();
        if (stagedChanges.length === 0 && unStagedChanges.length === 0) {
            console.log("Nothing to commit. Working tree clean");
            return;
        }

        if (stagedChanges.length > 0) {
            console.log("Changes to be commited");

            stagedChanges.forEach((change) => {
                console.log(`   ${change}`);
            });
        }

        if (unStagedChanges.length > 0) {
            console.log("Changes not staged");

            unStagedChanges.forEach((change) => {
                console.log(`   ${change}`);
            });
        }
    }

    restoreTreeFromCommit(treeHash: string): void {
        if (!this.objectStore) {
            throw new Error("ObjectStore is not initialized");
        }

        const treeContent = this.objectStore.read(treeHash);
        const treeObject = Tree.deserialize(treeContent);
        const treeEntries = treeObject.getEntries();

        for (const entry of treeEntries) {
            const fileName = entry.name;
            const fileContent = this.objectStore.read(entry.hash);

            const dir = path.dirname(fileName);
            fs.mkdirSync(dir, { recursive: true });

            fs.writeFileSync(fileName, fileContent);
        }

        const newIndex: Record<string, string> = {};
        treeEntries.forEach((entry) => {
            newIndex[entry.name] = entry.hash;
        });

        if (!this.index) {
            throw new Error("Index is not initialized");
        }

        this.index.write(newIndex);
    }

    resolveHashReference(reference: string): string {
        // If the provided reference is a commit hash itself
        const objectPath = path.join(
            this.rootPath,
            ".mgit",
            "objects",
            reference,
        );

        if (fs.existsSync(objectPath)) {
            return reference;
        }

        // If the provided reference is a tag
        const tagPath = path.join(
            this.rootPath,
            ".mgit",
            "refs",
            "tags",
            reference,
        );

        if (fs.existsSync(tagPath)) {
            return fs.readFileSync(tagPath, "utf-8");
        }

        throw new Error("Invalid Reference. Provide commit hash or tag");
    }

    checkout(reference: string): void {
        if (!this.objectStore) {
            throw new Error("ObjectStore is not initialized");
        }

        const commitHash = this.resolveHashReference(reference);
        const commitContent = this.objectStore.read(commitHash);
        const commitObject = Commit.deserialize(commitContent);

        this.restoreTreeFromCommit(commitObject.getTreeHash());
    }

    createBranch(branchName: string): void {
        const currentCommitHash = this.getCurrentCommitHash();

        if (!currentCommitHash) {
            throw new Error("Cannot create branch without commits");
        }

        const branchPath = path.join(
            this.rootPath,
            ".mgit",
            "refs",
            "heads",
            branchName,
        );

        if (fs.existsSync(branchPath)) {
            throw new Error("Branch already exists");
        }

        fs.writeFileSync(branchPath, currentCommitHash);
    }

    switchBranch(branchName: string): void {
        const branchPath = path.join(
            this.rootPath,
            ".mgit",
            "refs",
            "heads",
            branchName,
        );

        if (!fs.existsSync(branchPath)) {
            throw new Error("Branch does not exist");
        }

        const commitHash = fs.readFileSync(branchPath, "utf8").trim();

        if (!commitHash) {
            throw new Error("Branch has no commit history");
        }

        this.checkout(commitHash);

        const HEADPath = path.join(this.rootPath, ".mgit", "HEAD");

        fs.writeFileSync(HEADPath, `ref: refs/heads/${branchName}`);
        this.updateCurrentBranch(commitHash);
    }

    resetHard(commitHash: string): void {
        if (!this.objectStore) {
            throw new Error("ObjectStore is not initialized");
        }

        const commitContent = this.objectStore.read(commitHash);
        const commitObject = Commit.deserialize(commitContent);
        this.updateCurrentBranch(commitHash);
        this.restoreTreeFromCommit(commitObject.getTreeHash());
    }

    createTag(tagName: string): void {
        const currentCommitHash = this.getCurrentCommitHash();

        if (!currentCommitHash) {
            throw new Error("Cannot create tag without commits");
        }

        const tagPath = path.join(
            this.rootPath,
            ".mgit",
            "refs",
            "tags",
            tagName,
        );

        if (fs.existsSync(tagPath)) {
            throw new Error("Tag already exists");
        }

        fs.writeFileSync(tagPath, currentCommitHash);
    }

    restoreSourceHead(fileName: string): void {
        if (!this.objectStore) {
            throw new Error("Objectstore does not exist");
        }
        if (!this.index) {
            throw new Error("Index is not initialized");
        }

        const currentCommitHash = this.getCurrentCommitHash();
        if (!currentCommitHash) {
            throw new Error("No commit history");
        }

        const commitContent = this.objectStore.read(currentCommitHash);
        const commitObject = Commit.deserialize(commitContent);

        const treeContent = this.objectStore.read(commitObject.getTreeHash());

        const tree = Tree.deserialize(treeContent);
        const entry = tree.getEntries().find((e) => e.name === fileName);

        if (!entry) {
            throw new Error("File does not exist in latest commit");
        }

        this.index.add(fileName, entry.hash);
        const fileContent = this.objectStore.read(entry.hash);

        fs.writeFileSync(fileName, fileContent);
    }

    restoreSourceIndex(fileName: string): void {
        if (!this.objectStore) {
            throw new Error("Objectstore does not exist");
        }
        if (!this.index) {
            throw new Error("Index is not initialized");
        }

        const indexEntries = this.index.read();
        const fileHash = indexEntries[fileName];

        if (!fileHash) {
            throw new Error("File is not staged");
        }
        const fileContent = this.objectStore.read(fileHash);
        fs.writeFileSync(fileName, fileContent);
    }
}
