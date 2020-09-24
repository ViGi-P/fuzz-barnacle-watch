import watchman from "fb-watchman";
import { chalk } from "@caporal/core";
import { spawn, ChildProcess } from "child_process";
import { exitSignals, labels } from "../utils";

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

export class Watch {
  private directory = process.cwd();
  private client = new watchman.Client();
  private exitCleanupCB: Function;
  private children: ChildProcess[] = [];
  private ignoreArray: string[];

  constructor(
    directory: string,
    private commands: string[],
    exitCleanupCB: Function,
    private synchronously: boolean,
    ignoreArray: string[],
  ) {
    this.directory = directory === "."
      ? process.cwd()
      : `${process.cwd()}/${directory}`;
    this.ignoreArray = ignoreArray.map((item) => {
      if (directory === ".") return item;
      return `${item.replace(RegExp(`^(${directory}\/)`, "g"), "")}`;
    });
    this.exitCleanupCB = () => {
      exitCleanupCB(directory);
    };

    this.addWatch();
    this.setupExit();
  }

  private setupExit() {
    exitSignals.forEach((eventType) => {
      process.on(eventType, () => {
        this.removeSubscription();
      });
    });
  }

  private addWatch() {
    this.client.command(
      ["watch", this.directory],
      (error, resp: WatchResponse) => {
        if (error) {
          throw error;
        }

        if (resp.warning) {
          console.warn(labels.warn, resp.warning);
        }

        console.log(labels.watching, resp.watch);
        this.addSubscription();
      },
    );
  }

  private addSubscription() {
    const sub = {
      expression: ["allof", ["match", "*"]],
      fields: ["name", "size", "mtime_ms", "exists", "type"],
    };

    this.client.command(["subscribe", this.directory, this.directory, sub], (
      error,
    ) => {
      if (error) {
        this.removeWatch();
        throw error;
      }
    } /*, resp*/);

    this.client.on("subscription", (resp: SubscriptionResponse) => {
      if (resp.subscription !== this.directory) return;

      if (!resp.is_fresh_instance && resp.files) {
        for (const ignore of this.ignoreArray) {
          if (resp.files.some((file) => file.name === ignore)) return;
        }

        console.log(
          labels.changed,
          ...resp.files.reduce<string[]>((acc, file) => {
            let res = file.name;
            if (file.type === "d") {
              res = `${labels.directory}${chalk.white(res)}`;
            }
            if (!file.exists) {
              res = `${labels.deleted}${res}`;
            }
            acc.push(res);
            return acc;
          }, []),
        );
      }

      this.children.forEach((child) => child.kill(2));

      if (this.synchronously) {
        this.spawnSynchronously();
      } else {
        this.spawnConcurrently();
      }
    });
  }

  private spawnSynchronously() {
    const execute = (command: string, i: number) => {
      const splitCommand = command.split(" ");
      const child = spawn(
        splitCommand[0],
        splitCommand.slice(1),
        { stdio: "inherit" },
      );
      console.log(
        labels.executing,
        chalk.cyanBright(`${child.pid}`),
        chalk.white.underline.bold(command),
      );
      this.children.push(child);
      child.on("exit", (status, signal) => {
        console.log(
          labels.exited,
          chalk.cyanBright(`${child.pid}`),
          chalk.white.underline.bold(command),
          labels.exitStatus,
          status,
          labels.exitSignal,
          signal,
        );

        this.children.splice(
          this.children.findIndex((ch) => ch.pid === child.pid),
          1,
        );

        if (
          this.commands[i + 1] && exitSignals.every((sig) => sig !== signal)
        ) {
          execute(this.commands[i + 1], i + 1);
        }
      });
    };

    execute(this.commands[0], 0);
  }

  private spawnConcurrently() {
    for (const command of this.commands) {
      const splitCommand = command.split(" ");
      const child = spawn(
        splitCommand[0],
        splitCommand.slice(1),
        { stdio: "inherit" },
      );
      console.log(
        labels.executing,
        chalk.cyanBright(`${child.pid}`),
        chalk.white.underline.bold(command),
      );
      this.children.push(child);
      child.on("exit", (status, signal) => {
        console.log(
          labels.exited,
          chalk.cyanBright(`${child.pid}`),
          chalk.white.underline.bold(command),
          labels.exitStatus,
          status,
          labels.exitSignal,
          signal,
        );

        this.children.splice(
          this.children.findIndex((ch) => ch.pid === child.pid),
          1,
        );
      });
    }
  }

  private removeSubscription() {
    this.client.command(["unsubscribe", this.directory, this.directory], () => {
      this.removeWatch();
    });
  }

  private removeWatch() {
    this.client.command(
      ["watch-del", this.directory],
      (error, resp) => {
        if (error) {
          this.client.cancelCommands(error.message);
        }

        if (resp.warning) {
          console.warn(labels.warn, resp.warning);
        }

        this.client.end();
        this.children.forEach((child) => child.kill(2));
        this.exitCleanupCB();
      },
    );
  }
}
