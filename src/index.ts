#!/usr/bin/env node

import { program } from '@caporal/core';
import { Watcher } from './WatcherExec';

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
        new Watcher(t, [`${c}`]);
      } else if (
        typeof t === 'object' &&
        typeof c === 'object' &&
        t.length === c.length
      ) {
        logger.info('Not implemented');
      } else {
        throw Watcher.usageError;
      }
    } catch (error) {
      logger.error(error.message);
      process.exit(0);
    }
  });

program.run();
