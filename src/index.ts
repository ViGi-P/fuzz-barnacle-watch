#!/usr/bin/env node

import { program, chalk } from "@caporal/core";
import { ValidOptions, FBW } from "./classes";
import { labels } from "./utils";

/** @internal */
const packageDetails = require("../package.json");
/** @internal */
const syncMessage =
  `Enables synchronous execution of commands associated with each target context.
i.e. if there are multiple commands associated with a particular target, only these commands will be executed synchronously w.r.t. each other. No synchronicity is established between different targets.
In EXAMPLES <2>, there are two commands associated with \`src\` & two commands associated with \`dist\`.
'echo src:1' will always execute before 'echo src:2' & 'echo dist:1' will always execute before 'echo dist:2'. No other order of execution can be predetermined.
`;
/** @internal */
const examples = [
  chalk.yellowBright(
    "fbw --target=src --run='echo changed' --target=./src --run='echo another' --ignore='src/db.json, src/mockData.js'",
  ),
  chalk.yellowBright(
    "fbw sync -t=src -r='echo src:1' -t=dist -r='echo dist:1' -t=src -r='echo src:2' -t=dist -r='echo dist:2'",
  ),
];

program
  .version(packageDetails.version)
  .name(packageDetails.name)
  .description(packageDetails.description)
  .disableGlobalOption("--no-color")
  .disableGlobalOption("--quiet")
  .disableGlobalOption("--silent")
  .disableGlobalOption("--verbose")
  .argument(
    "sync",
    syncMessage,
  )
  .option(
    "-r, --run <command...>",
    "Runs <command> when corresponding target changes",
  )
  .option(
    "-t, --target <directory...>",
    "Watches <directory> for changes.",
  )
  .option(
    "-i, --ignore <files>",
    "Ignores specified <files> within targets.\nMust be supplied as comma separated list of relative paths.",
  )
  .action(async ({ options, args }) => {
    const t = options.target;
    const i = `${options.ignore}`.split(",").map((item) =>
      ValidOptions.parseTarget(item.trim())
    );
    const r = options.run;
    const s = Object.keys(args).some((key) => key === "sync");
    try {
      const options = new ValidOptions(t, r);
      /*const fbw = */ new FBW(options.data, s, i);
    } catch (error) {
      console.error(labels.error, error.message);
      console.log(
        chalk.red(`Run ${chalk.white.underline("fbw --help")} for usage info.`),
      );
    }
  })
  .help(
    `<1> ${examples[0]}
    \n<2> ${examples[1]}`,
    { sectionName: "EXAMPLES" },
  );

program.run();
