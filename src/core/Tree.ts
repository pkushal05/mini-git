type TreeEntry = {
    name: string;
    hash: string;
    type: "blob" | "tree";
};

export class Tree {
    constructor(private entries: TreeEntry[]) {}

    getEntries(): TreeEntry[] {
        return this.entries;
    }

    serialize(): string {
        return this.entries
            .map((e) => {
                return `${e.type} ${e.name} ${e.hash}`;
            })
            .sort((a, b) => a.localeCompare(b))
            .join("\n");
    }

    static deserialize(treeContent: string) {
        const lines = treeContent.split("\n");

        const entries = lines
            .filter((line) => line.trim() !== "")
            .map((line) => {
                const [type, name, hash] = line.split(" ");

                return {
                    type: type as "blob" | "tree",
                    name,
                    hash,
                };
            });

        return new Tree(entries);
    }
}
