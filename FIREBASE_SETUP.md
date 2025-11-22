# Firebase Setup Guide

To enable persistence (saving data) for your application, you need to set up a free Firebase project.

## Step 1: Create a Firebase Project
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Click **"Add project"**.
3.  Enter a name (e.g., `the404s-app`) and click **Continue**.
4.  Disable Google Analytics (not needed for this) and click **Create project**.
5.  Wait for it to finish and click **Continue**.

## Step 2: Enable Firestore (Database)
1.  In the left sidebar, click **Build** -> **Firestore Database**.
2.  Click **Create database**.
3.  Choose a location (e.g., `nam5 (us-central)` or one closer to you) and click **Next**.
4.  **Important:** Select **Start in test mode** (this allows read/write access for 30 days, which is easiest for now).
5.  Click **Create**.

## Step 3: Enable Storage (Images/Videos)
1.  In the left sidebar, click **Build** -> **Storage**.
2.  Click **Get started**.
3.  Click **Next** (keep "Start in test mode").
4.  Click **Done**.

## Step 4: Get Your API Keys
1.  Click the **Gear icon** (Project settings) next to "Project Overview" in the top left.
2.  Scroll down to the "Your apps" section.
3.  Click the **Web icon** (`</>`) to create a web app.
4.  Enter a nickname (e.g., `Web App`) and click **Register app**.
5.  **Copy the configuration values** shown in the code block (apiKey, authDomain, etc.).

## Step 5: Update Your Environment Variables
1.  Open the `.env` file in your project root.
2.  Fill in the values you copied from Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## Step 6: Add to Vercel (For Hosted Site)
If you are deploying to Vercel, you must also add these same variables to your Vercel Project Settings under **Environment Variables**.
