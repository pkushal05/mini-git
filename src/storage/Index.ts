import fs from "node:fs";

export class Index {
    constructor(private indexPath: string) {}

    read(): Record<string, string> {
        if (fs.existsSync(this.indexPath)) {
            return {};
        }

        const data = fs.readFileSync(this.indexPath, "utf-8");
        if (!data) return {};

        return JSON.parse(data);
    }
    write(entries: Record<string, string>): void {
        const data = JSON.stringify(entries, null, 2);

        fs.writeFileSync(this.indexPath, data);
    }
    add(filePath: string, hash: string): void {
        const entries = this.read();

        entries[filePath] = hash;
        this.write(entries);
    }
}
