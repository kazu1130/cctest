const token = process.env.GH_TOKEN;
import { execSync } from 'node:child_process';


const url = `https://api.github.com/repos/kazu1130/cctest/actions/workflows/release.yml/dispatches`;

const response = await fetch(url, {
  method: 'POST',
  headers: {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    "ref":"main"
    //inputs: {
    //  environment: 'staging',
    //},
  }),
});

if (!response.ok) {
  const body = await response.text();
  throw new Error(`workflow_dispatch failed: ${response.status} ${body}`);
}

console.log('Dispatched successfully:', response.status);

