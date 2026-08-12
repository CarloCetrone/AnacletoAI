const NVIDIA_API_KEY = "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";

async function testStream() {
  console.log("Starting stream request...");
  const startTime = Date.now();

  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${NVIDIA_API_KEY}`
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3.5-lightning-30b-a3b",
        messages: [{ role: "user", content: "Explain quantum mechanics in one paragraph." }],
        temperature: 1,
        top_p: 0.95,
        max_tokens: 4096,
        stream: true,
        chat_template_kwargs: { enable_thinking: true },
        reasoning_budget: 4096
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

    let firstChunkTime = -1;
    let hasReasoning = false;
    
    // @ts-ignore
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      if (firstChunkTime === -1) {
        firstChunkTime = Date.now() - startTime;
        console.log(`\n[Time to first chunk: ${firstChunkTime}ms]`);
      }
      
      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            const delta = data.choices[0]?.delta;
            
            if (delta?.reasoning_content) {
              hasReasoning = true;
              process.stdout.write(`\x1b[34m${delta.reasoning_content}\x1b[0m`);
            }
            if (delta?.content) {
              process.stdout.write(delta.content);
            }
          } catch(e) {}
        }
      }
    }
    
    console.log(`\n\nFinished in ${Date.now() - startTime}ms. Has reasoning: ${hasReasoning}`);
  } catch (err) {
    console.error("Stream failed:", err);
  }
}

testStream();
