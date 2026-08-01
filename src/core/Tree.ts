type TreeEntry = {
    name: string;
    hash: string;
    type: "blob" | "tree";
};

export class Tree {
    constructor(private entries: TreeEntry[]) {}

    serialize(): string {
        return this.entries
            .map((e) => {
                return `${e.type} ${e.name} ${e.hash}`;
            })
            .sort((a, b) => a.localeCompare(b))
            .join("\n");
    }
}
