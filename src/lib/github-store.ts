import { Octokit } from 'octokit';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.GITHUB_REPO_OWNER;
const REPO_NAME = process.env.GITHUB_REPO_NAME;
const BRANCH = 'main'; // Or 'master', depending on your default branch

// Initialize Octokit only if token is present
const octokit = GITHUB_TOKEN ? new Octokit({ auth: GITHUB_TOKEN }) : null;

export async function getGitHubFile(path: string) {
    if (!octokit || !REPO_OWNER || !REPO_NAME) return null;

    try {
        const response = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: path,
            ref: BRANCH,
        });

        // GitHub API returns content as base64
        if (Array.isArray(response.data) || !('content' in response.data)) {
            throw new Error('File is a directory or invalid');
        }

        const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
        return { content, sha: response.data.sha };
    } catch (error) {
        console.error(`Error fetching ${path} from GitHub:`, error);
        return null;
    }
}

export async function saveGitHubFile(path: string, content: string, message: string, sha?: string) {
    if (!octokit || !REPO_OWNER || !REPO_NAME) return false;

    try {
        // If no SHA provided, try to get it first (for updates)
        let currentSha = sha;
        if (!currentSha) {
            const existing = await getGitHubFile(path);
            if (existing) {
                currentSha = existing.sha;
            }
        }

        await octokit.request('PUT /repos/{owner}/{repo}/contents/{path}', {
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: path,
            message: message,
            content: Buffer.from(content).toString('base64'),
            sha: currentSha,
            branch: BRANCH,
        });

        return true;
    } catch (error) {
        console.error(`Error saving ${path} to GitHub:`, error);
        return false;
    }
}
