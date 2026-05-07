import * as cache from '@actions/cache';
import * as core from '@actions/core';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface RestoreResult {
  hit: boolean;
  key: string;
  dataDir: string;
}

export async function restoreDataCache(prefix: string, version: string): Promise<RestoreResult> {
  const dataDir = dataDirForOS();
  const key = `${prefix}-${process.platform}-${version}`;
  const restoreKey = `${prefix}-${process.platform}-`;

  try {
    const restored = await cache.restoreCache([dataDir], key, [restoreKey]);
    if (restored) {
      core.info(`Restored pluggy data-dir cache from key ${restored}`);
      return { hit: true, key, dataDir };
    }
    core.info(`No data-dir cache hit for ${key}; will populate on save.`);
    return { hit: false, key, dataDir };
  } catch (err) {
    core.warning(`Failed to restore data-dir cache: ${formatError(err)}`);
    return { hit: false, key, dataDir };
  }
}

export async function saveDataCache(key: string, dataDir: string): Promise<void> {
  try {
    await cache.saveCache([dataDir], key);
    core.info(`Saved pluggy data-dir cache under key ${key}`);
  } catch (err) {
    core.warning(`Failed to save data-dir cache: ${formatError(err)}`);
  }
}

function dataDirForOS(): string {
  const home = homedir();
  if (process.platform === 'darwin') {
    return join(home, 'Library', 'Caches', 'pluggy');
  }
  if (process.platform === 'win32') {
    return join(process.env.LOCALAPPDATA || join(home, 'AppData', 'Local'), 'pluggy', 'cache');
  }
  return join(process.env.XDG_CACHE_HOME || join(home, '.cache'), 'pluggy');
}

function formatError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
