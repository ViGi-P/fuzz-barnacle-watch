#!/usr/bin/env node

import { program } from '@caporal/core';
// import { promisify } from 'util';

import {
  usageError,
  formatTarget,
  isTargetDir,
  checkWatchmanInstalled,
  setupExit,
  addWatch,
} from './utils';
const packageDetails = require('../package.json');

program
  .version(packageDetails.version)
  .name(packageDetails.name)
  .description(packageDetails.description)
  .disableGlobalOption('--no-color')
  .disableGlobalOption('--quiet')
  .disableGlobalOption('--silent')
  .disableGlobalOption('--verbose')
  .option(
    '-c, --command <command...>',
    'Command to execute when corresponding <target> changes'
  )
  .option(
    '-t, --target <path...>',
    'Target file/directory to watch for changes'
  )
  .action(async ({ logger, options }) => {
    try {
      let { t, c } = options;
      if (
        (typeof t === 'string' ||
          typeof t === 'number' ||
          typeof t === 'boolean') &&
        (typeof c === 'string' ||
          typeof c === 'number' ||
          typeof c === 'boolean')
      ) {
        const target = formatTarget(`${t}`);
        const command = `${c}`;
        await isTargetDir(target);

        logger.info(`${target} exists, can try running ${command}`);

        // check capability
        await checkWatchmanInstalled();
        // setup exit
        setupExit();

        // add watch
        await addWatch(target, (error, resp) => {
          if (error) {
            throw error;
          }

          if ('warning' in resp) {
            logger.warn(resp.warning);
          }

          logger.info(`Watching ${resp.watch}`);
          // makeSubscription(client, resp.watch, resp.relative_path);
        });
      } else if (
        typeof t === 'object' &&
        typeof c === 'object' &&
        t.length === c.length
      ) {
        const targets = t.map(formatTarget);
        const commands = c.map((com) => `${com}`);
        await Promise.all(targets.map(isTargetDir));

        logger.info(`${targets} exist, can try running respective ${commands}`);
      } else {
        throw usageError;
      }
    } catch (error) {
      logger.error(error.message);
    }
  });

program.run();
