/**
 * LLM Client - Wrapper for xAI API
 * Provides utilities for chat, code analysis, quiz generation, and more
 */

const XAI_API_KEY = process.env.XAI_API_KEY || import.meta.env.VITE_XAI_API_KEY || '';
const XAI_API_BASE = import.meta.env.VITE_API_BASE 
  ? `${import.meta.env.VITE_API_BASE}/api`
  : 'http://localhost:8000/api';
const DEFAULT_MODEL = 'qwen2.5-coder:3b-instruct-q4_K_M';

// Note: Ensure the API key checks don't block requests if we rely on a local backend without keys.


/**
 * Make a streaming request to xAI API
 * @param {string} prompt - The prompt to send
 * @param {number} maxTokens - Max tokens in response
 * @param {function} onChunk - Callback for each streamed chunk
 * @returns {Promise<string>} Full response text
 */
export const streamLLMResponse = async (prompt, maxTokens = 1000, onChunk = null) => {

  try {
    const response = await fetch(`${XAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'bypass-tunnel-reminder': 'true',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`LLM API error: ${error.error?.message || 'Unknown error'}`);
    }

    let fullText = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter((line) => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              fullText += content;
              if (onChunk) {
                onChunk(content);
              }
            }
          } catch {
            // Ignore parsing errors
          }
        }
      }
    }

    return fullText;
  } catch (error) {
    console.error('LLM streaming error:', error);
    throw error;
  }
};

/**
 * Get a complete LLM response (non-streaming)
 * @param {string} prompt - The prompt to send
 * @param {number} maxTokens - Max tokens in response
 * @returns {Promise<string>} Response text
 */
export const getLLMResponse = async (prompt, maxTokens = 1000) => {

  try {
    const response = await fetch(`${XAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'bypass-tunnel-reminder': 'true',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`LLM API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('LLM error:', error);
    throw error;
  }
};

/**
 * Generate a knowledge chat response with vault context
 * @param {string} query - User question
 * @param {Array} contextDocs - Vault documents as context
 * @returns {Promise<string>} Answer with citations
 */
export const generateKnowledgeChatResponse = async (query, contextDocs = []) => {
  const contextText = contextDocs
    .map((doc) => `<document name="${doc.name}" type="${doc.type}">\n${doc.content}\n</document>`)
    .join('\n\n');

  const prompt = `You are an expert tutor. Answer the following question based on the provided materials.
If information from the materials is relevant, explicitly cite which material(s) you're using.

Materials:
${contextText}

Student question: ${query}

Provide a clear, comprehensive answer with specific references to the materials where applicable.`;

  return getLLMResponse(prompt, 1500);
};

/**
 * Analyze code and provide feedback
 * @param {string} code - Code to analyze
 * @param {string} language - Programming language
 * @param {string} analysisType - Type: 'explain', 'bugs', 'improve', 'comments'
 * @returns {Promise<string>} Analysis result
 */
export const analyzeCode = async (code, language = 'python', analysisType = 'bugs') => {
  const typePrompts = {
    explain: `Explain what this ${language} code does in simple terms. Break it down line by line.`,
    bugs: `Identify potential bugs, logic errors, or performance issues in this ${language} code. List each issue with severity (high/medium/low).`,
    improve: `Suggest optimizations and improvements for this ${language} code. Include time/space complexity analysis.`,
    comments: `Generate meaningful, clear comments for this ${language} code. Follow best practices for the language.`,
  };

  const prompt = `${typePrompts[analysisType] || typePrompts.explain}

\`\`\`${language}
${code}
\`\`\`

Provide actionable, specific feedback.`;

  return getLLMResponse(prompt, 2000);
};

/**
 * Generate quiz questions from context
 * @param {string} context - Material to generate questions from
 * @param {number} count - Number of questions
 * @param {string} difficulty - 'easy', 'medium', 'hard'
 * @param {string} topic - Optional specific topic
 * @returns {Promise<Array>} Array of questions with options and answers
 */
export const generateQuizQuestions = async (context, count = 5, difficulty = 'medium', topic = '') => {
  const prompt = `Generate ${count} multiple-choice questions at ${difficulty} difficulty level based on the following material.
${topic ? `Focus on the topic of: ${topic}` : ''}

Material:
${context}

Return a JSON array with this structure:
[
  {
    "id": "q1",
    "question": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct": 0,
    "explanation": "Why this is correct..."
  }
]

Rules:
- correct is the 0-indexed position of the correct option
- Make options plausible but distinct
- Explanations should be educational
- Return ONLY valid JSON, no other text`;

  const response = await getLLMResponse(prompt, 2000);

  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No valid JSON found in response');
  } catch (error) {
    console.error('Quiz generation parse error:', error);
    return [];
  }
};

/**
 * Answer a question grounded in transcript
 * @param {Array} transcript - Transcript blocks
 * @param {string} question - User question
 * @returns {Promise<Object>} Answer with grounding info
 */
export const answerVideoQuestion = async (transcript, question) => {
  const transcriptText = transcript
    .map((block) => `[${block.startLabel}] ${block.text}`)
    .join('\n');

  const prompt = `You are helping a student understand a video. Answer their question based ONLY on the transcript provided.

Transcript:
${transcriptText}

Student question: ${question}

Provide a clear answer that references specific parts of the transcript. Format timestamps as [HH:MM:SS] or [MM:SS].`;

  const answer = await getLLMResponse(prompt, 1000);

  return {
    answer,
    source: 'transcript',
    timestamp: new Date().toISOString(),
  };
};

/**
 * Extract citations from LLM response
 * @param {string} response - LLM response text
 * @param {Array} possibleSources - Available source documents
 * @returns {Array} Citations found in response
 */
export const extractCitations = (response, possibleSources = []) => {
  const citations = [];
  const sourceNames = possibleSources.map((s) => s.name || s).filter(Boolean);

  for (const source of sourceNames) {
    if (response.includes(source) || response.toLowerCase().includes(source.toLowerCase())) {
      citations.push({
        source,
        relevance: 'mentioned',
      });
    }
  }

  return citations;
};

export default {
  getLLMResponse,
  streamLLMResponse,
  generateKnowledgeChatResponse,
  analyzeCode,
  generateQuizQuestions,
  answerVideoQuestion,
  extractCitations,
};
