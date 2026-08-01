export class Commit {
    private timestamp: number;
    constructor(
        private treeHash: string,
        private parentHash: string | null,
        private message: string,
    ) {
        this.timestamp = Date.now();
    }

    serialize(): string {
        return `tree ${this.treeHash} parent ${this.parentHash} message ${this.message} timestamp ${this.timestamp}`;
    }
}
