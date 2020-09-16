import fs from 'fs';

export class DirChecker {
  get notDirError() {
    return new Error(`${this.target} is not a directory in ${process.cwd()}`);
  }

  constructor(public target: string) {
    this.isTargetDir();
  }

  private isTargetDir() {
    try {
      const isDir = fs.statSync(this.target).isDirectory();
      if (!isDir) throw this.notDirError;
      return isDir;
    } catch (error) {
      throw this.notDirError;
    }
  }
}
