import fs from 'node:fs/promises';
import path from 'node:path';

export class PendingPanelStore {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async save(panel) {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(panel, null, 2), 'utf8');
    return panel;
  }

  async load() {
    try {
      return JSON.parse(await fs.readFile(this.filePath, 'utf8'));
    } catch (error) {
      if (error.code === 'ENOENT') return null;
      throw error;
    }
  }

  async clear() {
    try {
      await fs.rm(this.filePath, { force: true });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}
