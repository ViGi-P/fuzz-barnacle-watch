import fs from 'fs';
import chalk from 'chalk';
import { ParserTypes } from '@caporal/core';
import watchman from 'fb-watchman';
// import debounce from "lodash.debounce";
// import { promisify } from "util";
// const spawn = promisify(require("child_process").exec);

const client = new watchman.Client();

export async function checkWatchmanInstalled() {
  client.capabilityCheck(
    { optional: [], required: ['relative_root'] },
    (error) => {
      if (error) {
        client.end();
        throw error;
      }
    }
  );
}

type addWatchCB = (error: Error | null | undefined, resp: any) => void;

export async function addWatch(target: string, cb: addWatchCB) {
  client.command(['watch-project', `${process.cwd()}/${target}`], cb);
}

function safeExit(successFlags: any[]) {
  if (successFlags.every((flag) => flag === true)) {
    client.end();
    process.exit(0);
  }
}

function cleanup(event: string) {
  console.log(chalk.bold(`${event} fired, cleaning up`));
  const cleanupSuccessFlags: [
    unsubscribeSuccess: boolean,
    watchDelSuccess: boolean
  ] = [true, false];

  //   this.command(
  //     ["unsubscribe", `${__dirname}`, devServerSubscription],
  //     (error, resp) => {
  //       if (error) {
  //         console.error("Failed to unsubscribe:", error);
  //         return;
  //       }
  //       console.log(`Unsubscribed: ${resp.unsubscribe}`);
  //       cleanupSuccessFlags[0] = true;
  //       safeExit(this, cleanupSuccessFlags);
  //     },
  //   );

  client.command(['watch-del-all'], (err) => {
    if (err) {
      throw err;
    }
    cleanupSuccessFlags[1] = true;
    safeExit(cleanupSuccessFlags);
  });
}

export function setupExit() {
  ['SIGINT', 'SIGUSR1', 'SIGUSR2', 'SIGTERM'].forEach((eventType) => {
    process.on(eventType, cleanup);
  });
}

export const usageError = new Error(
  'Incorrect usage! Check `fbw --help` for usage information'
);

const notDirError = (target: string) =>
  new Error(`${target} is not a directory in ${process.cwd()}`);

export function formatTarget(target: ParserTypes): string {
  if (typeof target !== 'string') target = `${target}`;
  if (target.indexOf('./') === 0) target = target.slice(2);
  if (target.indexOf('/') === 0) target = target.slice(1);
  if (target[target.length - 1] === '/') target = target.slice(0, -1);
  return target;
}

export async function isTargetDir(target: string) {
  try {
    const isDir = fs.statSync(target).isDirectory();
    if (!isDir) throw notDirError(target);
    return isDir;
  } catch (error) {
    throw notDirError(target);
  }
}
