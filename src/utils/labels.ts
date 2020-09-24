import { chalk } from "@caporal/core";

export const labels = {
  exited: chalk.greenBright("EXITED:"),
  exitStatus: chalk.cyan("STATUS:"),
  exitSignal: chalk.cyan("SIGNAL:"),
  error: chalk.red("ERROR:"),
  warn: chalk.redBright("WARN:"),
  deleted: chalk.redBright("DELETED:"),
  watching: chalk.magentaBright("WATCHING:"),
  executing: chalk.magenta("EXECUTING:"),
  changed: chalk.blueBright("CHANGED:"),
  directory: chalk.whiteBright("DIRECTORY:"),
};
