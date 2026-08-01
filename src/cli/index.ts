import { Command } from "commander";
import { init } from "../commands/init";
import { add } from "../commands/add";

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

program.parse();
