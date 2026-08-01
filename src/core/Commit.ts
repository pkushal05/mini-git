export class Commit {
    constructor(
        private treeHash: string,
        private parentHash: string | null,
        private message: string,
        private timestamp: number = Date.now(),
    ) {}

    getMessage(): string {
        return this.message;
    }

    getTreeHash(): string {
        return this.treeHash;
    }

    getParentHash(): string | null {
        return this.parentHash;
    }

    getTimestamp(): number {
        return this.timestamp;
    }

    serialize(): string {
        return [
            `tree ${this.treeHash}`,
            `parent ${this.parentHash}`,
            `message ${this.message}`,
            `timestamp ${this.timestamp}`,
        ].join("\n");
    }

    static deserialize(fileContent: string): Commit {
        const lines = fileContent.split("\n");

        const treeHash = lines[0].replace("tree ", "").trim();
        const parent = lines[1].replace("parent ", "").trim();
        const parentHash = parent === "null" ? null : parent;

        const message = lines[2].replace("message ", "").trim();
        const timestamp = +lines[3].replace("timestamp ", "").trim();

        return new Commit(treeHash, parentHash, message, timestamp);
    }
}
