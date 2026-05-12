import Groq from 'groq-sdk';

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

/**
 * Stream a response from Groq.
 * @param {Array} messages - Array of {role, content} objects
 * @param {Function} onChunk - Callback for each text chunk
 */
export async function streamGroqResponse(messages, onChunk) {
  const stream = await client.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    stream: true,
    temperature: 0.7,
    max_tokens: 2048,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) onChunk(content);
  }
}
