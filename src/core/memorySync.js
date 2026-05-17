import fs from 'node:fs/promises';
import path from 'node:path';

const allowedExtensions = new Set(['.json', '.md']);

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

async function walk(root, current = root, files = []) {
  const entries = await fs.readdir(current, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      await walk(root, fullPath, files);
    } else if (entry.isFile() && allowedExtensions.has(path.extname(entry.name))) {
      const relativePath = toPosix(path.relative(root, fullPath));
      files.push({ fullPath, relativePath });
    }
  }
  return files;
}

export async function listLocalMemoryFiles(localRoot) {
  const files = await walk(localRoot);
  return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

export async function syncLocalMemoryToGitHub({ localRoot, repo, destinationPrefix = 'imported/local' }) {
  const files = await listLocalMemoryFiles(localRoot);
  const prefix = destinationPrefix.replace(/^\/+|\/+$/g, '');
  let uploaded = 0;
  for (const file of files) {
    const text = await fs.readFile(file.fullPath, 'utf8');
    await repo.uploadText(`${prefix}/${file.relativePath}`, text, `sync local memory ${file.relativePath}`);
    uploaded += 1;
  }
  return { uploaded, files: files.map((file) => file.relativePath) };
}
