import fs from 'node:fs/promises';
import path from 'node:path';

function safeStamp() {
  return new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
}

export class LocalMemoryRepo {
  constructor(rootDir) {
    this.rootDir = rootDir;
  }

  async ensure() {
    await fs.mkdir(path.join(this.rootDir, 'adventures'), { recursive: true });
    await fs.mkdir(path.join(this.rootDir, 'system'), { recursive: true });
    await fs.mkdir(path.join(this.rootDir, 'memories', 'shards'), { recursive: true });
    await fs.mkdir(path.join(this.rootDir, 'vitality'), { recursive: true });
  }

  async writeAdventureResult(result) {
    await this.ensure();
    const file = path.join(this.rootDir, 'adventures', `${safeStamp()}-${result.map.id}.json`);
    await fs.writeFile(file, JSON.stringify({ ...result, writtenAt: new Date().toISOString() }, null, 2));

    for (const [index, memory] of (result.memories ?? []).entries()) {
      const memoryFile = path.join(this.rootDir, 'memories', 'shards', `${safeStamp()}-${index}.md`);
      await fs.writeFile(memoryFile, `# ${memory.title}\n\n${memory.summary}\n`);
    }

    await fs.writeFile(
      path.join(this.rootDir, 'vitality', `${safeStamp()}-${result.map.id}.json`),
      JSON.stringify({ vitalityAfter: result.vitalityAfter, dormancy: result.dormancy }, null, 2)
    );
  }

  async writeMemory(memory) {
    await this.ensure();
    const memoryFile = path.join(this.rootDir, 'memories', 'shards', `${safeStamp()}-${memory.id ?? memory.type ?? 'memory'}.md`);
    await fs.writeFile(memoryFile, `# ${memory.title ?? '记忆晶片'}\n\n${memory.text ?? memory.summary ?? JSON.stringify(memory, null, 2)}\n`);
  }

  async writeLatestAliveSnapshot(snapshot) {
    await this.ensure();
    await fs.writeFile(
      path.join(this.rootDir, 'system', 'latest_alive.json'),
      JSON.stringify({ ...snapshot, writtenAt: new Date().toISOString() }, null, 2)
    );
  }
}
