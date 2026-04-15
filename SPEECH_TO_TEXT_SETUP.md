# YouTube Speech-to-Text Setup Guide

This guide helps you set up Google Cloud Speech-to-Text for transcribing YouTube videos with disabled captions.

## Prerequisites

1. **Google Cloud Project**
   - Go to https://console.cloud.google.com
   - Create a new project
   - Enable the Speech-to-Text API
   - Create a service account with Speech-to-Text permissions
   - Generate and download a JSON key file

2. **System Dependencies**
   - macOS: Install ffmpeg and yt-dlp
     ```bash
     brew install ffmpeg yt-dlp
     ```
   - Ubuntu/Debian:
     ```bash
     sudo apt-get install ffmpeg python3-pip
     pip install yt-dlp
     ```
   - Docker: Ensure ffmpeg and yt-dlp are in your Dockerfile

## Local Development Setup

1. **Set Environment Variables**

   Create a `.env.local` file in the project root:

   ```
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account-key.json
   ```

2. **Place Credentials File**

   Save your Google Cloud service account JSON key file to a secure location and update the path in `.env.local`.

3. **Install Dependencies**

   ```bash
   npm install
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## Production Deployment (Render.com)

1. **Set Environment Variables in Render Dashboard**
   - Go to your service dashboard
   - Click "Environment"
   - Add new environment variables:
     - `GOOGLE_CLOUD_PROJECT_ID` = your-project-id
     - `GOOGLE_APPLICATION_CREDENTIALS` = /opt/render/project/src/.gcp-key.json (or similar)

2. **Add Credentials to Render**

   Option A: Store in a secret file
   - Add to your `render.yaml`:
     ```yaml
     services:
       - type: web
         name: monolearn
         runtime: node
         buildCommand: |
           npm install && \
           echo "$GCP_SERVICE_ACCOUNT_KEY" > .gcp-key.json && \
           npm run build
         startCommand: npm run start
         envVars:
           - key: NODE_ENV
             value: production
           - key: GCP_SERVICE_ACCOUNT_KEY
             sync: false # This should be a secret
     ```

   Option B: Upload file to Render
   - Use Render's Web Services → Environment to add the full JSON as a secret file path

3. **Install System Dependencies**

   Add to your `render.yaml`:

   ```yaml
   services:
     - type: web
       buildCommand: |
         apt-get update && \
         apt-get install -y ffmpeg python3-pip && \
         pip install yt-dlp &&\
         npm install && \
         npm run build
   ```

## Cost Considerations

- Google Cloud Speech-to-Text pricing: ~$0.006 per 15 seconds of audio
- A 60-minute video costs approximately $0.24 to transcribe
- Consider implementing caching to avoid re-transcribing the same videos

## Troubleshooting

**Error: "Google Cloud Speech-to-Text is not configured"**

- Verify `GOOGLE_CLOUD_PROJECT_ID` and `GOOGLE_APPLICATION_CREDENTIALS` are set
- Check that the credentials file exists and is readable
- Ensure the service account has Speech-to-Text API permissions

**Error: "Failed to download audio from YouTube"**

- Verify yt-dlp is installed: `yt-dlp --version`
- Check if video is public and not region-locked
- Try manually: `yt-dlp -f 251 -x --audio-format m4a "https://youtube.com/watch?v=..."`

**High Costs**

- Implement result caching in the database
- Set up a request queue to prevent concurrent transcriptions
- Consider setting up a budget alert in Google Cloud Console

## Next Steps

1. Test with a video that has disabled captions
2. Monitor Google Cloud billing
3. Consider adding caching if seeing repeated transcription requests
4. Set up alerts for unexpected costs
