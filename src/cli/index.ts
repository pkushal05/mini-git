import { Command } from "commander";
import { init } from "../commands/init";
import { add } from "../commands/add";
import { commit } from "../commands/commit";
import { log } from "../commands/log";
import { status } from "../commands/status";
import { checkout } from "../commands/checkout";
import { createBranch } from "../commands/branch";
import { switchBranch } from "../commands/switch";
import { executeResetHard } from "../commands/reset";
import { createTag } from "../commands/tag";
import { restoreFromHead, restoreFromIndex } from "../commands/restore";
import { merge } from "../commands/merge";

const program = new Command();

program
    .name("mgit")
    .description("A miniature Git implementation built from scratch")
    .version("1.0.0");

program
    .command("init")
    .description("Initialize a new Mini Git Repository")
    .action(() => {
        init();
    });

program
    .command("add")
    .description("Add a file to staging area")
    .argument("<file>")
    .action((file) => {
        add(file);
    });

program
    .command("commit")
    .description("Create a snapshot of the codebase")
    .argument("<message>")
    .action((message) => {
        commit(message);
    });

program
    .command("log")
    .description("Log the commit history")
    .action(() => {
        log();
    });

program
    .command("status")
    .description("Check the current state of your working directory")
    .action(() => {
        status();
    });

program
    .command("checkout")
    .description("Rollback to any version of the project")
    .argument("<commitHash>")
    .action((commitHash) => {
        checkout(commitHash);
    });

program
    .command("branch")
    .description("Create a new branch")
    .argument("<branchName>")
    .action((branchName) => {
        createBranch(branchName);
    });

program
    .command("switch")
    .description("Switch to any exisiting branch")
    .argument("<branchName>")
    .action((branchName) => {
        switchBranch(branchName);
    });

program
    .command("reset")
    .option("--hard", "perform hard reset")
    .argument("<commitHash>")
    .action((commitHash, options) => {
        if (options.hard) {
            executeResetHard(commitHash);
        }
    });

program
    .command("tag")
    .description("Add a tag to the latest commit")
    .argument("<tagName>")
    .action((tagName) => {
        createTag(tagName);
    });

program
    .command("restore")
    .option("--source-head", "perfrom a restore from HEAD")
    .description("Restore a specific file from the last staged version")
    .argument("<fileName>")
    .action((fileName, options) => {
        if (options.sourceHead) {
            restoreFromHead(fileName);
        } else {
            restoreFromIndex(fileName);
        }
    });

program
    .command("merge")
    .description("Perform a fast-forward merge between two branches")
    .argument("<targetBranch>")
    .action((targetBranch) => {
        merge(targetBranch);
    });

program.parse();
