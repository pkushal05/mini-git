import crypto from "crypto";
import fs from "fs";
import path from "path";

export class ObjectStore {
    constructor(private objectsPath: string) {}

    save(content: string): string {
        let hash = crypto.createHash("sha256").update(content).digest("hex");

        const filePath = path.join(this.objectsPath, hash);

        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, content);
        }

        return hash;
    }

    read(hash: string): string {
        const filePath = path.join(this.objectsPath, hash);

        if (!fs.existsSync(filePath)) {
            throw new Error("Object File not found");
        }

        return fs.readFileSync(filePath, "utf-8");
    }
}
