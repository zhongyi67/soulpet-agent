export function createMemoryCoreManifest({ owner, pet }) {
  return {
    schemaVersion: 1,
    owner,
    pet: { id: pet.id, name: pet.name, species: pet.species },
    protectedPaths: [
      'identity/birth.json',
      'identity/owner_anchor.json',
      'memories/protected/first_memory.json',
      'system/latest_alive.json'
    ],
    directories: [
      'identity',
      'memories/protected',
      'memories/events',
      'adventures',
      'inventory',
      'vitality',
      'evolution',
      'learning',
      'panels',
      'revivals',
      'system'
    ],
    createdAt: new Date().toISOString()
  };
}

export async function initializeMemoryCore({ repo, pet }) {
  const owner = pet.owner?.name ?? 'unknown-owner';
  const manifest = createMemoryCoreManifest({ owner, pet });
  await repo.uploadJson('identity/birth.json', {
    id: pet.id,
    name: pet.name,
    species: pet.species,
    quirk: pet.quirk,
    createdAt: pet.createdAt,
    owner
  }, 'birth soulpet memory core');

  const ownerAnchor = pet.memories?.find((memory) => memory.level === 'owner_anchor');
  if (ownerAnchor) await repo.uploadJson('identity/owner_anchor.json', ownerAnchor, 'record owner anchor');

  const firstMemory = pet.memories?.find((memory) => memory.level === 'first_memory') ?? pet.memories?.[0];
  if (firstMemory) await repo.uploadJson('memories/protected/first_memory.json', firstMemory, 'record first memory');

  await repo.uploadJson('system/manifest.json', manifest, 'initialize soulpet memory manifest');
  await repo.writeLatestAliveSnapshot({ petId: pet.id, vitality: pet.vitality, bond: pet.bond, inventory: pet.inventory ?? [] });
  return manifest;
}
