const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const workflowId = "release.yml"
const ref = process.env.TARGET_REF || 'main';
const token = process.env.GH_TOKEN;
const { execSync } = require('node:child_process');



const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`;

const response = await fetch(url, {
  method: 'POST',
  headers: {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    ref,
    inputs: {
      environment: 'staging',
    },
  }),
});

if (!response.ok) {
  const body = await response.text();
  throw new Error(`workflow_dispatch failed: ${response.status} ${body}`);
}

console.log('Dispatched successfully:', response.status);

