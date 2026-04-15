# Backend & Frontend Integration Guide

## Overview
This guide verifies that the backend and frontend are properly connected and all features are working correctly.

## Architecture

```
Frontend (React + Vite) 
    ↓ (fetch requests)
Backend (Node.js HTTP server)
    ├─ Serves static files (dist/)
    ├─ API endpoints (/api/*)
    └─ YouTube analysis service
```

## Feature Checklist

### ✅ 1. Health Check
**Endpoint:** `GET /api/health`

Test in browser or terminal:
```bash
curl http://localhost:8787/api/health
```

Expected response:
```json
{"ok": true}
```

---

### ✅ 2. YouTube Video Analysis (Standard Captions)

**Feature:** Analyze videos WITH captions enabled

**Test URL:** Any public YouTube video with captions
```
https://www.youtube.com/watch?v=VideoID
```

**Frontend:** 
1. Go to VideoHub page
2. Paste YouTube URL
3. Click "Analyze"

**Backend Flow:**
1. Extract video ID from URL
2. Fetch YouTube metadata (via YouTube oEmbed API)
3. Fetch transcript (via youtube-transcript library)
4. Build analysis (segments, keywords, themes)
5. Return JSON response

**Expected Response:**
```json
{
  "analysis": {
    "title": "Video Title",
    "duration": 3600000,
    "transcript": {
      "blocks": [...],
      "timestampedText": "..."
    },
    "segments": [...],
    "keyThemes": ["theme1", "theme2"],
    ...
  }
}
```

---

### ✅ 3. YouTube Speech-to-Text Fallback (Disabled Captions)

**Feature:** Transcribe videos with DISABLED captions using Google Cloud Speech-to-Text

**Prerequisites:**
- Google Cloud project with Speech-to-Text API enabled
- Service account credentials (JSON key file)
- Environment variables set:
  - `GOOGLE_CLOUD_PROJECT_ID`
  - `GOOGLE_APPLICATION_CREDENTIALS`
- System has `yt-dlp` and `ffmpeg` installed

**Test URL:** Video with disabled captions
```
https://www.youtube.com/watch?v=BsuPmtcNB74
```

**Backend Flow:**
1. Try YouTube transcript → Fails (disabled)
2. Download audio using yt-dlp (MP3 format)
3. Send to Google Cloud Speech-to-Text API
4. Convert response to YouTube-compatible format
5. Build analysis same as normal
6. Clean up temporary audio files

**Expected Behavior:**
- Slightly longer processing time (audio transcription takes 20-60s)
- Console logs: `"YouTube captions unavailable. Attempting audio transcription..."`
- Same final analysis output

**Troubleshooting:**
```
Error: "Google Cloud Speech-to-Text is not configured"
→ Check GOOGLE_CLOUD_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS env vars

Error: "Failed to download audio from YouTube"
→ Verify yt-dlp is installed: yt-dlp --version
→ Ensure video is public and not region-locked

Error: "Speech-to-text transcription failed"
→ Check Google Cloud Speech-to-Text API is enabled
→ Verify service account has permissions
```

---

### ✅ 4. Chat & Transcript Analysis

**Feature:** Ask questions about the transcript

After analysis, users can:
- Ask detailed questions about content
- Get timestamp-based answers
- View specific segments

**Example Questions:**
- "Explain this in simpler terms"
- "What's the main point of this section?"
- "Show me the 5-minute mark"

Uses `answerTranscriptQuestion` function from `videoIntelligence.js`

---

### ✅ 5. Static Asset Serving

**Feature:** Serve frontend files in production

In production mode (`NODE_ENV=production`):
- All requests serve from `/dist` directory
- Falls back to `/dist/index.html` for SPA routing
- Includes CSS, JS, images, fonts

**Test:**
```bash
npm run build
NODE_ENV=production npm run start
```

Then visit `http://localhost:8787/` and verify UI loads

---

### ✅ 6. CORS & Cross-Origin Requests

**Feature:** Allow frontend to call backend from different domains/IPs

**CORS Headers Added:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

Supports requests from any domain, including:
- Development (localhost:5173 → localhost:8787)
- Production (render.com domain → backend)
- External IPs (74.220.49.0/24, 74.220.57.0/24, etc.)

---

## Local Development Testing

### 1. Start Development Servers
```bash
npm run dev
```

This runs both frontend (port 5173) and backend (port 8787)

### 2. Test Standard YouTube Analysis
```bash
curl "http://localhost:8787/api/youtube/analyze?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

### 3. Test Frontend
- Open `http://localhost:5173`
- Navigate to VideoHub
- Paste YouTube URL
- Click Analyze

### 4. Test in Browser DevTools
```javascript
// In browser console
fetch('/api/youtube/analyze?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  .then(r => r.json())
  .then(d => console.log(d))
```

---

## Production Deployment (Render)

### Setup Steps

1. **Configure render.yaml:**
```yaml
services:
  - type: web
    name: monolearn
    runtime: node
    startCommand: npm run start
    buildCommand: npm install && npm run build
    envVars:
      - key: NODE_ENV
        value: production
      - key: GOOGLE_CLOUD_PROJECT_ID
        value: your-project-id
      - key: GOOGLE_APPLICATION_CREDENTIALS
        sync: false  # Secret file
```

2. **Build runs:**
- `npm install` - Install dependencies
- `npm run build` - Build frontend with Vite (creates `/dist`)

3. **Start runs:**
- `npm run start` - Runs Node.js server on port 8787
- Server serves `/dist` files
- API endpoints handle requests

### Deployment Verification
```bash
# After deploy to Render
curl https://your-app.onrender.com/api/health
# Expected: {"ok": true}

# Check frontend loads
curl https://your-app.onrender.com/
# Expected: HTML content (rendered index.html)

# Test API
curl "https://your-app.onrender.com/api/youtube/analyze?url=..."
```

---

## Network/Firewall Configuration

### For IP Addresses: 74.220.49.0/24, 74.220.57.0/24

These IP ranges may be:
- Render's infrastructure servers
- External deployment environments
- Monitoring/logging services

**Ensure:**
- Port 8787 is open to these IPs
- CORS headers allow traffic (✓ Already configured)
- Firewall rules permit inbound HTTPS/HTTP

---

## Performance Monitoring

### Metrics to Track

1. **YouTube Analysis (Standard)**
   - Target: <2 seconds
   - Factors: Video duration, network latency

2. **Speech-to-Text (Disabled Captions)**
   - Target: 20-60 seconds (depends on video length)
   - Cost: ~$0.006 per 15 seconds

3. **Asset Loading**
   - Bundle size: Check with `npm run build`
   - Target: <500KB gzipped

### Debug Logging

```bash
# Development - see detailed logs
npm run dev

# Production - set debug env var
DEBUG=* npm run start
```

---

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/health` | Server health check |
| GET | `/api/youtube/analyze?url=...` | Analyze YouTube video |
| GET | `/` | Serve index.html (SPA) |
| GET | `/*` | Serve static files |

---

## Common Issues & Solutions

### Issue: "Cannot POST /api/youtube/analyze"
**Solution:** Endpoint only accepts GET requests
```bash
# ✗ Wrong
curl -X POST http://localhost:8787/api/youtube/analyze?url=...

# ✓ Correct
curl -X GET http://localhost:8787/api/youtube/analyze?url=...
```

### Issue: Frontend shows "Unable to analyze this YouTube video"
**Causes:**
1. URL is invalid
2. Video doesn't have captions AND Google Cloud not configured
3. Network error (backend unreachable)

**Debug:**
```javascript
// Open DevTools → Network tab
// Check the /api/youtube/analyze request
// Look for error message in response
```

### Issue: CORS error in browser
**Solution:** CORS headers are already added in code (✓)
If still seeing errors, check:
1. Server is running
2. API endpoint is correct
3. Browser isn't caching old response

---

## Testing Checklist

- [ ] Health endpoint returns `{ok: true}`
- [ ] Frontend loads at `/`
- [ ] YouTube URL analysis works (video with captions)
- [ ] Error handling works (invalid URL, private video)
- [ ] Transcript displays correctly
- [ ] Chat/questions functionality works
- [ ] Copy transcript button works
- [ ] Video metadata shows (title, duration, language)
- [ ] Speech-to-text fallback works (if configured)
- [ ] Static assets load (CSS, images)
- [ ] No console errors in browser

---

## Next Steps

1. Test locally: `npm run dev`
2. Deploy to Render
3. Test production endpoints
4. Monitor for errors/performance
5. Configure alerts for failures

---

**Last Updated:** 2026-04-15
**Backend:** Node.js HTTP server
**Frontend:** React + Vite
**API:** RESTful (GET requests)
