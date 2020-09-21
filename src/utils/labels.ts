import { chalk } from "@caporal/core";

export const labels = {
  error: chalk.red("ERROR:"),
  warn: chalk.redBright("WARN:"),
  deleted: chalk.redBright("DELETED:"),
  watching: chalk.magentaBright("WATCHING:"),
  executing: chalk.magenta("EXECUTING:"),
  changed: chalk.blueBright("CHANGED:"),
  directory: chalk.whiteBright("DIRECTORY:"),
};
