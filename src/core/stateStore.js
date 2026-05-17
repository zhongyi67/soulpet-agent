import fs from 'node:fs/promises';
import path from 'node:path';

export class StateStore {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async save(state) {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(state, null, 2));
  }

  async load() {
    return JSON.parse(await fs.readFile(this.filePath, 'utf8'));
  }

  async exists() {
    try {
      await fs.access(this.filePath);
      return true;
    } catch {
      return false;
    }
  }
}
