const NVIDIA_API_KEY = "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";

async function test(enable_thinking: boolean, reasoning_budget: number) {
  console.log(`Testing enable_thinking=${enable_thinking}, reasoning_budget=${reasoning_budget}...`);
  const startTime = Date.now();
  
  const options: any = {
    model: "nvidia/nemotron-3.5-lightning-30b-a3b",
    messages: [{ role: "user", content: "Explain quantum mechanics in one paragraph." }],
    temperature: 1,
    top_p: 0.95,
    max_tokens: 4096,
    stream: true
  };
  
  if (enable_thinking !== null) {
      options.chat_template_kwargs = { enable_thinking: enable_thinking };
  }
  if (reasoning_budget !== null) {
      options.reasoning_budget = reasoning_budget;
  }

  try {
    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${NVIDIA_API_KEY}`
      },
      body: JSON.stringify(options)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

    let hasReasoning = false;
    
    // @ts-ignore
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunkStr = decoder.decode(value, { stream: true });
      const lines = chunkStr.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            const delta = data.choices[0]?.delta;
            
            if (delta?.reasoning_content) {
              hasReasoning = true;
            }
          } catch(e) {}
        }
      }
    }
    
    console.log(`Finished. Has reasoning: ${hasReasoning}`);
  } catch (err) {
    console.error("Stream failed:", err);
  }
}

async function runAll() {
    await test(false, null);
    await test(false, 0);
    await test(null, null);
}

runAll();
