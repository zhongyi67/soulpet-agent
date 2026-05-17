import { spawn } from 'node:child_process';

export function buildCreateRepoCommand({ repoName, description = '灵伴私有记忆核' }) {
  return ['gh', 'repo', 'create', repoName, '--private', '--description', description, '--disable-wiki'];
}

export function buildPutFileCommand({ owner, repo, filePath }) {
  const encodedPath = encodeURIComponent(filePath);
  return ['gh', 'api', `repos/${owner}/${repo}/contents/${encodedPath}`, '-X', 'PUT', '--input', '-'];
}

export function buildGetFileShaCommand({ owner, repo, filePath, branch = 'main' }) {
  const encodedPath = encodeURIComponent(filePath);
  return ['gh', 'api', `repos/${owner}/${repo}/contents/${encodedPath}?ref=${branch}`, '--jq', '.sha'];
}

export function runCommand(command, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(command[0], command.slice(1), { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve({ stdout, stderr, code });
      else reject(new Error(`command failed (${code}): ${stderr || stdout}`));
    });
    if (input) child.stdin.write(input);
    child.stdin.end();
  });
}

export class GitHubMemoryRepo {
  constructor({ owner, repo, runner = runCommand, branch = 'main' }) {
    this.owner = owner;
    this.repo = repo;
    this.runner = runner;
    this.branch = branch;
  }

  async createPrivateRepo({ repoName = this.repo } = {}) {
    return this.runner(buildCreateRepoCommand({ repoName }));
  }

  async getFileSha(filePath) {
    const result = await this.runner(buildGetFileShaCommand({ owner: this.owner, repo: this.repo, filePath, branch: this.branch }));
    return result.stdout.trim();
  }

  async uploadText(filePath, text, message = `update ${filePath}`) {
    const content = Buffer.from(text).toString('base64');
    const payload = { message, content, branch: this.branch };
    try {
      payload.sha = await this.getFileSha(filePath);
    } catch (error) {
      if (!/Not Found|404|could not resolve|command failed/.test(error.message)) throw error;
    }
    return this.runner(buildPutFileCommand({ owner: this.owner, repo: this.repo, filePath }), JSON.stringify(payload));
  }

  async uploadJson(filePath, value, message = `update ${filePath}`) {
    return this.uploadText(filePath, JSON.stringify(value, null, 2), message);
  }

  async writeMemory(memory) {
    const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
    return this.uploadJson(`memories/events/${stamp}-${memory.type ?? 'memory'}.json`, memory, `record ${memory.type ?? 'memory'}`);
  }

  async writeAdventureResult(result) {
    const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-');
    return this.uploadJson(`adventures/${stamp}-${result.map.id}.json`, result, `record adventure ${result.map.id}`);
  }

  async writeLatestAliveSnapshot(snapshot) {
    return this.uploadJson('system/latest_alive.json', { ...snapshot, writtenAt: new Date().toISOString() }, 'update latest alive snapshot');
  }
}
