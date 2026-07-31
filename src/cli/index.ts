import { Command } from "commander";
import { init } from "../commands/init";

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

program.parse();
