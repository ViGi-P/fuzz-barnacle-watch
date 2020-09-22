import { chalk } from "@caporal/core";
import watchman from "fb-watchman";
import { ParsedData } from "./ValidOptions";
import { Watch } from "./Watch";
import { exitSignals } from "../utils";

export class FBW {
  private client = new watchman.Client();

  private checkWatchmanInstallation() {
    this.client.capabilityCheck(
      { optional: [], required: ["relative_root"] },
      (error) => {
        this.client.end();

        if (error) {
          throw error;
        }

        for (const [dir, commands] of this.options) {
          new Watch(
            dir,
            commands,
            this.removeDir,
            this.sync,
            this.ignoreArray,
          );
        }

        this.setupExit();
      },
    );
  }

  constructor(
    private options: ParsedData,
    private sync: boolean,
    private ignoreArray: string[],
  ) {
    this.checkWatchmanInstallation();
  }

  private setupExit() {
    const safeExit = (eventType: string) => {
      if (Object.keys(this.options).length === 0) {
        console.log(chalk.whiteBright(`Shutting down.`));
        process.exit(0);
      } else {
        setTimeout(() => {
          safeExit(eventType);
        }, 500);
      }
    };

    exitSignals.forEach((eventType) => {
      process.on(eventType, () => {
        console.log(chalk.whiteBright(`\n${eventType} triggered.`));
        safeExit(eventType);
      });
    });
  }

  private removeDir = (dir: string) => {
    const index = this.options.findIndex((item) => item[0] === dir);
    if (index !== -1) this.options.splice(index, 1);
  };
}
