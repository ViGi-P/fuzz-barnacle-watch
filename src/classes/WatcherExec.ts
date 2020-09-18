import { chalk } from "@caporal/core";
import watchman from "fb-watchman";
import { DirChecker } from "./DirChecker";

import { ChildProcess, spawn } from "child_process";

interface WatchResponse {
  watch: string;
  warning?: string;
}

interface FileData {
  name: string;
  size: number;
  mtime_ms: number;
  exists: boolean;
  type: "d" | "f";
}

interface SubscriptionResponse {
  subscription: string;
  files: FileData[];
  is_fresh_instance: boolean;
}

export class WatchExec {
  private t!: string;
  static client = new watchman.Client();
  static clientEnded: boolean = false;
  static watchCount = 0;
  private pids: number[] = [];

  static checkWatchmanInstalled() {
    this.client.capabilityCheck(
      { optional: [], required: ["relative_root"] },
      (error) => {
        if (error) {
          this.client.end();
          throw error;
        }
      },
    );
  }

  static safeExit(message: string) {
    if (--this.watchCount === 0) {
      if (!this.clientEnded) {
        console.log(message);
        this.client.end();
        this.clientEnded = true;
      }
      process.exit(0);
    }
  }

  static usageError = new Error(
    "Incorrect usage! Check `fbw --help` for usage information",
  );

  set target(target: string) {
    if (target === ".") {
      target = "";
    } else {
      if (target.indexOf("./") === 0) target = target.slice(2);
      if (target[target.length - 1] === "/") target = target.slice(0, -1);
    }

    if (target.length) {
      const dir = new DirChecker(target);
      this.t = `${process.cwd()}/${dir.target}`;
    } else this.t = `${process.cwd()}`;
  }

  get target() {
    return this.t;
  }

  constructor(t: string, private commands: string[]) {
    WatchExec.checkWatchmanInstalled();
    this.target = t;
    this.setupExit();
    this.addWatch();
  }

  private deleteWatch(cb: Function) {
    WatchExec.client.command(["watch-del", this.target], (err /*, resp*/) => {
      if (err) {
        throw err;
      }
      cb();
    });
  }

  private setupExit() {
    ["SIGINT", "SIGUSR1", "SIGUSR2", "SIGTERM"].forEach((eventType) => {
      process.on(eventType, (eventType) => {
        WatchExec.client.command(["unsubscribe", this.target, this.target], (
          error, /*, resp*/
        ) => {
          if (error) {
            throw error;
          }

          this.deleteWatch(
            WatchExec.safeExit.bind(
              WatchExec,
              chalk.bold.whiteBright(
                `\n${eventType} triggered, shutting down`,
              ),
            ),
          );
        });
      });
    });
  }

  private addWatch() {
    WatchExec.client.command(
      ["watch", this.target],
      (error, resp: WatchResponse) => {
        if (error) {
          throw error;
        }

        if (resp.warning) {
          console.warn(chalk.bold.redBright("warn:"), resp.warning);
        }
        this.addSubscription();
      },
    );
  }

  private addSubscription(relative_path?: string) {
    const sub = {
      expression: ["allof", ["match", "*"]],
      fields: ["name", "size", "mtime_ms", "exists", "type"],
      ...(relative_path ? { relative_root: relative_path } : {}),
    };

    WatchExec.client.command(["subscribe", this.target, this.target, sub], (
      error, /*, resp*/
    ) => {
      if (error) {
        this.deleteWatch(WatchExec.safeExit.bind(WatchExec, error.message));
        throw error;
      }
      WatchExec.watchCount++;
    });

    WatchExec.client.on("subscription", (resp: SubscriptionResponse) => {
      if (resp.subscription !== this.target) return;

      this.pids.forEach((pid) => process.kill(pid));

      if (resp.is_fresh_instance) {
        console.log(
          chalk.bold.cyanBright("watching:"),
          this.target,
          chalk.bold.cyanBright("commands:"),
          this.commands,
        );
      } else {
        if (resp.files) {
          console.log(
            chalk.bold.magentaBright("changed:"),
            ...resp.files.reduce<string[]>((acc, file) => {
              let res = file.name;
              if (file.type === "d") {
                res = chalk.white(`${chalk.bold("dir:")}${res}`);
              }
              if (!file.exists) {
                res = `${chalk.bold.redBright("deleted:")}${res}`;
              }
              acc.push(res);
              return acc;
            }, []),
          );
        }
      }

      this.commands.forEach(async (command) => {
        console.log(
          chalk.bold.blueBright("executing:"),
          chalk.italic.underline.white(command),
        );
        const splitCommands = command.split(" ");
        let child: ChildProcess;
        try {
          child = spawn(
            splitCommands[0],
            splitCommands.slice(1),
            { stdio: "inherit" },
          );
          this.pids.push(child.pid);
        } catch (error) {
          WatchExec.client.command(["unsubscribe", this.target, this.target], (
            err, /*, resp*/
          ) => {
            if (err) {
              throw err;
            }

            this.deleteWatch(
              WatchExec.safeExit.bind(
                WatchExec,
                chalk.bold.yellowBright(
                  `\nerror occurred while running ${command} at ${this.target}`,
                ),
              ),
            );
          });
          throw error;
        }

        child.on("close", (code, signal) => {
          const pidIndex = this.pids.indexOf(child.pid);

          if (pidIndex !== -1) {
            this.pids.splice(pidIndex, 1);
          }

          console.log(
            chalk.italic.underline.white(command),
            chalk.bold.blueBright(`exit code:`),
            code,
            chalk.bold.blueBright(`signal:`),
            signal,
          );
        });
      });
    });
  }
}
