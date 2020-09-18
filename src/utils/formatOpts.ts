import { ParserTypes } from "@caporal/core";

interface ResObject {
  [key: string]: string[];
}

export function formatOpts(targets: ParserTypes[], commands: ParserTypes[]) {
  const res: ResObject = {};

  targets.forEach((target, i) => {
    let key = `${target}`;
    if (key === "." || key === "./") key = ".";
    if (res[key]) res[key].push(`${commands[i]}`);
    else res[key] = [`${commands[i]}`];
  });

  return res;
}
