import { chalk, ParserTypes } from '@caporal/core';
import watchman from 'fb-watchman';
import { promisify } from 'util';
import { DirChecker } from './DirChecker';

const exec = promisify(require('child_process').exec);

interface WatchResponse {
  watch: string;
  warning?: string;
}

interface FileData {
  name: string;
  size: number;
  mtime_ms: number;
  exists: boolean;
  type: 'd' | 'f';
}

interface SubscriptionResponse {
  subscription: string;
  files: FileData[];
  is_fresh_instance: boolean;
}

export class Watcher {
  private t!: string;
  static client = new watchman.Client();
  static subscriptions = 0;

  static checkWatchmanInstalled() {
    this.client.capabilityCheck(
      { optional: [], required: ['relative_root'] },
      (error) => {
        if (error) {
          this.client.end();
          throw error;
        }
      }
    );
  }

  static safeExit() {
    if (Watcher.subscriptions === 0) {
      Watcher.client.end();
      process.exit(0);
    }
  }

  static usageError = new Error(
    'Incorrect usage! Check `fbw --help` for usage information'
  );

  set target(target: string) {
    if (target === '.' || target === './' || target === '/') {
      target = '';
    } else {
      if (target.indexOf('./') === 0) target = target.slice(2);
      if (target.indexOf('/') === 0) target = target.slice(1);
      if (target[target.length - 1] === '/') target = target.slice(0, -1);
    }

    if (target.length) {
      const dir = new DirChecker(target);
      this.t = `${process.cwd()}/${dir.target}`;
    } else this.t = `${process.cwd()}`;
  }

  get target() {
    return this.t;
  }

  constructor(t: ParserTypes, private commands: string[]) {
    Watcher.checkWatchmanInstalled();
    this.target = `${t}`;
    this.setupExit();
    this.addWatch();
  }

  private deleteWatch(cb: Function) {
    Watcher.client.command(['watch-del', this.target], (err /*, resp*/) => {
      if (err) {
        throw err;
      }
      cb();
    });
  }

  private setupExit() {
    ['SIGINT', 'SIGUSR1', 'SIGUSR2', 'SIGTERM'].forEach((eventType) => {
      process.on(eventType, (eventType) => {
        console.log(
          chalk.bold(
            chalk.whiteBright(`\n${eventType} triggered, exiting gracefully`)
          )
        );
        Watcher.client.command(['unsubscribe', this.target, this.target], (
          error /*, resp*/
        ) => {
          if (error) {
            throw error;
          }

          Watcher.subscriptions--;
          this.deleteWatch(Watcher.safeExit);
        });
      });
    });
  }

  private addWatch() {
    Watcher.client.command(
      ['watch', this.target],
      (error, resp: WatchResponse) => {
        if (error) {
          throw error;
        }

        if (resp.warning) {
          console.warn(chalk.redBright('warn:'), resp.warning);
        }
        this.addSubscription();
      }
    );
  }

  private addSubscription(relative_path?: string) {
    const sub = {
      expression: ['allof', ['match', '*']],
      fields: ['name', 'size', 'mtime_ms', 'exists', 'type'],
      ...(relative_path ? { relative_root: relative_path } : {}),
    };

    Watcher.client.command(['subscribe', this.target, this.target, sub], (
      error /*, resp*/
    ) => {
      if (error) {
        this.deleteWatch(Watcher.safeExit);
        throw error;
      }
      Watcher.subscriptions++;
    });

    Watcher.client.on('subscription', (resp: SubscriptionResponse) => {
      if (resp.subscription !== this.target) return;

      if (resp.is_fresh_instance)
        console.log(
          chalk.cyanBright('watching:'),
          this.target,
          chalk.cyanBright('commands:'),
          this.commands
        );
      else {
        console.log(
          chalk.magentaBright('changed:'),
          ...resp.files.reduce<string[]>((acc, file) => {
            let res = file.name;
            if (file.type === 'd') res = chalk.white(`dir:${res}`);
            if (!file.exists) res = `${chalk.redBright('deleted:')}${res}`;
            acc.push(res);
            return acc;
          }, [])
        );
      }

      this.commands.forEach(async (command) => {
        console.log(
          chalk.blueBright('executing:'),
          chalk.italic(chalk.white(command))
        );
        const { stdout, stderr } = await exec(command);
        if (stderr) console.error(stderr);
        console.log(stdout);
      });
    });
  }
}
