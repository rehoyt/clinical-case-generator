# ClinicalCase AI - Synthetic Patient Generator

This project generates detailed synthetic patient cases for medical education and training using Gemini AI.

## Deployment on Vercel

To ensure Vercel picks up the latest changes:

1.  **Export to GitHub** from AI Studio (Settings -> Export to GitHub).
2.  Go to your **Vercel Dashboard**.
3.  Select the **ClinicalCase AI** project.
4.  Go to the **Deployments** tab.
5.  If the latest commit from GitHub is not appearing, go to **Settings -> Git** and ensure the **Production Branch** is set to `main`.
6.  You can also manually trigger a deployment by clicking the **"..." (three dots)** next to a previous deployment and selecting **"Redeploy"**.

## Environment Variables

Make sure to set the following environment variables in Vercel:

- `GEMINI_API_KEY`: Your Google Gemini API key.
- `VITE_GEMINI_API_KEY`: (Optional) For client-side access.
