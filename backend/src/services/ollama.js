const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

export async function streamOllamaResponse(messages, model, onChunk) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true, options: { temperature: 0.7 } }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error ${response.status}: ${await response.text()}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value, { stream: true }).split('\n').filter(Boolean)) {
      try {
        const json = JSON.parse(line);
        if (json.message?.content) onChunk(json.message.content);
        if (json.done) return;
      } catch {}
    }
  }
}
