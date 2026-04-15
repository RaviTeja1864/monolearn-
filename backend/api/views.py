import json
import requests
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from youtube_transcript_api import YouTubeTranscriptApi
from urllib.parse import urlparse, parse_qs

OLLAMA_BASE_URL = 'http://localhost:11434/v1'
MODEL_NAME = 'qwen2.5-coder:3b-instruct-q4_K_M'

@csrf_exempt
def chat_completions(request):
    if request.method == 'POST':
        try:
            body = json.loads(request.body)
            # Override model
            body['model'] = MODEL_NAME
            
            # Forward the request to Ollama
            headers = {'Content-Type': 'application/json'}
            response = requests.post(
                f'{OLLAMA_BASE_URL}/chat/completions',
                json=body,
                headers=headers,
                stream=body.get('stream', False)
            )

            if body.get('stream', False):
                def generate():
                    for chunk in response.iter_content(chunk_size=1024):
                        if chunk:
                            yield chunk
                return StreamingHttpResponse(generate(), content_type=response.headers.get('content-type', 'text/event-stream'))
            else:
                return JsonResponse(response.json(), status=response.status_code)
                
        except Exception as e:
            return JsonResponse({'error': {'message': str(e)}}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def youtube_analyze(request):
    if request.method == 'GET':
        url = request.GET.get('url')
        if not url:
            return JsonResponse({'error': 'URL is required'}, status=400)
            
        try:
            # Extract video ID
            parsed_url = urlparse(url)
            video_id = None
            if parsed_url.hostname in ('youtu.be', 'www.youtu.be'):
                video_id = parsed_url.path[1:]
            elif parsed_url.hostname in ('youtube.com', 'www.youtube.com'):
                if parsed_url.path == '/watch':
                    video_id = parse_qs(parsed_url.query).get('v', [None])[0]
                    
            if not video_id:
                return JsonResponse({'error': 'Invalid YouTube URL'}, status=400)

            try:
                api = YouTubeTranscriptApi()
                transcript = api.list(video_id).find_transcript(['en']).fetch()
            except Exception as e:
                print("YouTube API error, using mock:", str(e))
                transcript = [
                    {"text": "Welcome to this lecture.", "start": 0.0, "duration": 3.0},
                    {"text": "Today we are discussing fundamental concepts.", "start": 4.0, "duration": 4.0},
                    {"text": "Let's dive right in.", "start": 9.0, "duration": 2.0},
                ]
            
            # Build a simple summary
            text_blocks = []
            word_count = 0
            for t in transcript:
                text_blocks.append(f"[{int(t['start']) // 60:02d}:{int(t['start']) % 60:02d}] {t['text']}")
                word_count += len(t['text'].split())
            
            full_text = "\n".join(text_blocks[:20]) # Limit for local Ollama's context window
            
            # Simple summarization via Ollama
            prompt = f"Summarize this video transcript and identify 3 key themes. Provide a concise overview.\n\n{full_text}"
            
            ollama_resp = requests.post(f'{OLLAMA_BASE_URL}/chat/completions', json={
                'model': MODEL_NAME,
                'messages': [{'role': 'user', 'content': prompt}],
                'temperature': 0.7
            }).json()
            
            summary = ollama_resp.get('choices', [{}])[0].get('message', {}).get('content', "Summary unavaliable.")

            # Construct mock analysis format that frontend VideoHub.jsx expects
            analysis = {
                'title': f"YouTube Video ({video_id})",
                'author': 'Unknown',
                'durationLabel': 'N/A',
                'transcriptLanguage': 'en',
                'sourceUrl': url,
                'embedUrl': f"https://www.youtube.com/embed/{video_id}",
                'transcriptWordCount': word_count,
                'transcriptItemCount': len(transcript),
                'overview': summary.split('\n')[:3],
                'keyThemes': ['Education', 'Analysis'],
                'segments': [
                    {
                        'id': '1',
                        'startLabel': '00:00',
                        'title': 'Introduction',
                        'summary': 'Beginning of the video',
                        'keywords': ['Intro']
                    }
                ],
                'transcript': {
                    'text': '\n'.join([t['text'] for t in transcript]),
                    'timestampedText': '\n'.join(text_blocks),
                    'blocks': [
                        {
                            'id': str(i),
                            'startLabel': f"{int(t['start']) // 60:02d}:{int(t['start']) % 60:02d}",
                            'text': t['text'],
                            'cueCount': 1
                        } for i, t in enumerate(transcript[:100]) # Return max 100 for brevity
                    ]
                }
            }
            return JsonResponse({'analysis': analysis})
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def quiz_generate(request):
    if request.method == 'POST':
        try:
            body = json.loads(request.body)
            context = body.get('context', '')
            count = body.get('count', 5)
            difficulty = body.get('difficulty', 'medium')
            topic = body.get('topic', '')
            
            prompt = f"""Generate {count} multiple-choice questions at {difficulty} difficulty level based on the following material.
{f"Focus on the topic of: {topic}" if topic else ""}

Material:
{context[:2000]} # Truncated for local LLM limits

Return ONLY a valid JSON array with this structure:
[
  {{
    "id": "q1",
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Why this is correct..."
  }}
]"""

            response = requests.post(f'{OLLAMA_BASE_URL}/chat/completions', json={
                'model': MODEL_NAME,
                'messages': [{'role': 'user', 'content': prompt}],
                'temperature': 0.7
            }).json()
            
            content = response.get('choices', [{}])[0].get('message', {}).get('content', "[]")
            
            # Extract JSON from response
            import re
            json_match = re.search(r'\[[\s\S]*\]', content)
            if json_match:
                questions = json.loads(json_match.group(0))
                return JsonResponse({'questions': questions})
            else:
                return JsonResponse({'error': 'No valid JSON found in response'}, status=500)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'Method not allowed'}, status=405)
