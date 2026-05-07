import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import { chmodSync } from 'node:fs';
import { join } from 'node:path';
import { resolveVersion } from './versions';
import { restoreDataCache, saveDataCache } from './cache';

const STATE_KEY_CACHE_KEY = 'PLUGGY_DATA_CACHE_KEY';
const STATE_KEY_DATA_DIR = 'PLUGGY_DATA_DIR';

async function setup(): Promise<void> {
  const versionInput = core.getInput('pluggy-version') || 'latest';
  const useCache = core.getBooleanInput('cache');
  const cachePrefix = core.getInput('cache-key-prefix') || 'pluggy';
  const token = core.getInput('github-token');

  const version = await resolveVersion(versionInput, token);
  core.info(`Resolved pluggy version: ${version}`);

  const platform = mapPlatform();
  const arch = mapArch();
  const ext = platform === 'windows' ? '.exe' : '';
  const assetName = `pluggy-${platform}-${arch}${ext}`;

  let toolDir = tc.find('pluggy', version, arch);
  if (!toolDir) {
    const url = `https://github.com/pluggy-sh/pluggy/releases/download/v${version}/${assetName}`;
    core.info(`Downloading ${url}`);
    const downloaded = await tc.downloadTool(url);
    chmodSync(downloaded, 0o755);
    toolDir = await tc.cacheFile(downloaded, `pluggy${ext}`, 'pluggy', version, arch);
  } else {
    core.info(`Using cached pluggy ${version} from ${toolDir}`);
  }

  core.addPath(toolDir);

  let cacheHit = false;
  if (useCache) {
    const result = await restoreDataCache(cachePrefix, version);
    cacheHit = result.hit;
    core.saveState(STATE_KEY_CACHE_KEY, result.key);
    core.saveState(STATE_KEY_DATA_DIR, result.dataDir);
  }

  core.setOutput('pluggy-version', version);
  core.setOutput('pluggy-path', join(toolDir, `pluggy${ext}`));
  core.setOutput('cache-hit', String(cacheHit));
}

async function post(): Promise<void> {
  const key = core.getState(STATE_KEY_CACHE_KEY);
  const dataDir = core.getState(STATE_KEY_DATA_DIR);
  if (!key || !dataDir) {
    return;
  }
  await saveDataCache(key, dataDir);
}

function mapPlatform(): 'linux' | 'darwin' | 'windows' {
  switch (process.platform) {
    case 'linux':
      return 'linux';
    case 'darwin':
      return 'darwin';
    case 'win32':
      return 'windows';
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}

function mapArch(): 'amd64' | 'arm64' {
  switch (process.arch) {
    case 'x64':
      return 'amd64';
    case 'arm64':
      return 'arm64';
    default:
      throw new Error(`Unsupported arch: ${process.arch}`);
  }
}

async function run(): Promise<void> {
  try {
    if (process.env.STATE_isPost === 'true') {
      await post();
    } else {
      core.saveState('isPost', 'true');
      await setup();
    }
  } catch (err) {
    core.setFailed(err instanceof Error ? err.message : String(err));
  }
}

run();
