#!/usr/bin/env node

import { program } from '@caporal/core';
import { formatOpts } from './utils';
import { Watcher } from './classes';

const packageDetails = require('../package.json');

function createWatcher(formattedOpts: ReturnType<typeof formatOpts>) {
  for (const target in formattedOpts) {
    new Watcher(target, formattedOpts[target]);
  }
}

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
        const formattedOpts = formatOpts([t], [c]);
        createWatcher(formattedOpts);
      } else if (
        typeof t === 'object' &&
        typeof c === 'object' &&
        t.length === c.length
      ) {
        const formattedOpts = formatOpts(t, c);
        createWatcher(formattedOpts);
      } else {
        throw Watcher.usageError;
      }
    } catch (error) {
      logger.error(error.message);
      process.exit(0);
    }
  });

program.run();
