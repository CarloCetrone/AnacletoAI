import OpenAI from "https://esm.sh/openai@4.28.0";

const openai = new OpenAI({
    apiKey: "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",
    baseURL: "https://integrate.api.nvidia.com/v1"
});

async function run() {
    console.log("Starting OpenAI SDK stream with enable_thinking: false...");
    const streamOptions: any = {
        model: "nvidia/nemotron-3.5-lightning-30b-a3b",
        messages: [{ role: "user", content: "Explain quantum mechanics in one paragraph." }],
        temperature: 1,
        max_tokens: 4096,
        stream: true,
        chat_template_kwargs: { enable_thinking: false }
    };
    
    try {
        const responseStream = await openai.chat.completions.create(streamOptions) as any;
        let hasReasoning = false;
        for await (const chunk of responseStream) {
            const delta = chunk.choices?.[0]?.delta;
            if (delta?.reasoning_content) {
                hasReasoning = true;
            }
        }
        console.log("Finished SDK stream. Has reasoning:", hasReasoning);
    } catch(e) {
        console.error(e);
    }
}

run();
