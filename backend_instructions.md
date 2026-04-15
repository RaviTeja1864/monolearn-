# How to Run Your Vercel Fullstack Project with Local Ollama

Because your frontend is deployed on Vercel (using HTTPS) and your backend is running on your personal laptop (HTTP), modern browsers will block the "Mixed Content" requests. To make them communicate securely over the internet, we will use **ngrok**.

## 1. Run Ollama Locally

1. Open a terminal and ensure your Ollama server is running.
2. If it is your first time using the model, run:
   ```bash
   ollama run qwen2.5-coder:3b-instruct-q4_K_M
   ```
3. Make sure the Ollama API is available on `http://localhost:11434`.

## 2. Run the Django Backend

1. In another terminal, navigate to the `backend/` folder on your laptop:
   ```bash
   cd /home/dragon/Desktop/git-pcl/monolearn-/backend
   ```
2. Activate your virtual environment:
   ```bash
   source venv/bin/activate
   ```
3. Run the Django development server:
   ```bash
   python manage.py runserver 8000
   ```

Your backend API is now running locally at `http://localhost:8000`.

## 3. Expose the Backend to the Internet (Ngrok)

1. Download and install [ngrok](https://ngrok.com/download) if you haven't already.
2. In a new terminal, run:
   ```bash
   ngrok http 8000
   ```
3. Ngrok will give you an HTTPS forwarding URL (e.g., `https://a1b2c3d4.ngrok-free.app`). Copy this URL. Keep the terminal running.

## 4. Connect Your Vercel Frontend

1. Go to your Vercel project dashboard.
2. Navigate to **Settings > Environment Variables**.
3. Add a new variable:
   - **Key**: `VITE_API_BASE`
   - **Value**: The Ngrok HTTPS URL you copied in the previous step (without the trailing slash). E.g. `https://a1b2c3d4.ngrok-free.app`
4. Click **Save** and trigger a **Redeploy** on Vercel for the changes to take effect.

Your Vercel deployed site will now securely route all API requests (`/api/chat/completions`, `/api/youtube/analyze`, `/api/quiz/generate`) down to your laptop's Django server, which securely proxies the prompts to your local hardware running Ollama!
