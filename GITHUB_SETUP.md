# GitHub Storage Setup (Save in Code)

To enable "saving in the code" on Vercel, the app will commit changes directly to your GitHub repository.

## Step 1: Generate a GitHub Token
1.  Go to [GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens).
2.  Click **Generate new token (classic)**.
3.  **Note:** (Name it `the404s-vercel`).
4.  **Scopes:** Check the **`repo`** box (Full control of private repositories).
5.  Click **Generate token**.
6.  **Copy the token immediately** (you won't see it again).

## Step 2: Update Your Environment Variables
1.  Open the `.env` file in your project root.
2.  Fill in the following values:

```env
GITHUB_TOKEN=ghp_your_token_here
GITHUB_REPO_OWNER=your_github_username
GITHUB_REPO_NAME=your_repo_name
```
*(Example: If your repo URL is `github.com/john/my-app`, Owner is `john` and Name is `my-app`)*

## Step 3: Add to Vercel (CRITICAL)
For the hosted site to work, you **MUST** add these same variables to Vercel:

1.  Go to your Vercel Dashboard -> Project -> Settings -> Environment Variables.
2.  Add:
    *   `GITHUB_TOKEN`
    *   `GITHUB_REPO_OWNER`
    *   `GITHUB_REPO_NAME`
3.  **Redeploy** your application.

## How it Works
*   When you add a wish or photo, the app sends it to GitHub.
*   GitHub updates the code (`db.json` or `public/uploads`).
*   **Vercel detects the change and rebuilds the site.**
*   **Wait 1-2 minutes**, and your new content will appear live!
