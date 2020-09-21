import { ParsedOption, ParserTypes } from "@caporal/core";
import { statSync } from "fs";

export type ParsedData = [target: string, commands: string[]][];

export class ValidOptions {
  public data: ParsedData;

  static parseTarget(target: ParserTypes) {
    target = `${target}`;
    if (target === "." || target === "./") return ".";
    if (target.indexOf("./") === 0) target = target.slice(2);
    if (target[target.length - 1] === "/") target = target.slice(0, -1);
    return target;
  }

  static parseCommand(command: ParserTypes) {
    return `${command}`;
  }

  static isDirectory(target: string) {
    const notDirError = new Error(
      `${target} is not a directory in ${process.cwd()}`,
    );
    try {
      const isDir = statSync(target).isDirectory();
      if (!isDir) throw notDirError;
      return isDir;
    } catch (error) {
      throw notDirError;
    }
  }

  static parseData(targets: string[], commands: string[]) {
    const data: ParsedData = [];

    targets.forEach((t, i) => {
      if (this.isDirectory(t)) {
        const newIndex = data.findIndex((item) => item[0] === t);
        if (newIndex === -1) {
          data.push([t, [commands[i]]]);
        } else data[newIndex][1].push(commands[i]);
      }
    });

    return data;
  }

  constructor(targets: ParsedOption, commands: ParsedOption) {
    if (typeof targets !== "object") targets = [targets];
    if (typeof commands !== "object") commands = [commands];
    try {
      if (targets.length === commands.length) {
        this.data = ValidOptions.parseData(
          targets.map(ValidOptions.parseTarget),
          commands.map(ValidOptions.parseCommand),
        );
      } else {
        throw new Error(
          `${targets.length} target${(targets.length > 1 && "s") ||
            ""} & ${commands.length} command${(targets.length > 1 && "s") ||
            ""} found. Each target should have its own corresponding command`,
        );
      }
    } catch (error) {
      throw new Error(
        `Invalid options - ${error.message}.`,
      );
    }
  }
}
