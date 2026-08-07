import React, { useState } from 'react';
import { Code2, Copy, Check, Terminal, Cpu, Zap, ShieldCheck } from 'lucide-react';

export const ApiPlaygroundView: React.FC = () => {
  const [activeLang, setActiveLang] = useState<'python' | 'curl' | 'node' | 'go'>('python');
  const [copied, setCopied] = useState(false);

  const codeSnippets = {
    python: `import openai

client = openai.OpenAI(
    base_url="https://api.anacletoai.com/v1",
    api_key="anc_live_9942a78f0d8e23b"
)

response = client.chat.completions.create(
    model="anacleto-120b-omni",
    messages=[
        {"role": "system", "content": "You are a sovereign enterprise AI assistant."},
        {"role": "user", "content": "Perform legal risk analysis on section 4.2 of contract."}
    ],
    temperature=0.7,
    max_tokens=1024
)

print(response.choices[0].message.content)`,

    curl: `curl https://api.anacletoai.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer anc_live_9942a78f0d8e23b" \\
  -d '{
    "model": "anacleto-120b-omni",
    "messages": [
      {"role": "user", "content": "Summarize Q3 financial report metrics."}
    ],
    "temperature": 0.5
  }'`,

    node: `import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://api.anacletoai.com/v1',
  apiKey: 'anc_live_9942a78f0d8e23b'
});

async function main() {
  const completion = await openai.chat.completions.create({
    messages: [{ role: 'user', content: 'Analyze GDPR data retention policies.' }],
    model: 'anacleto-120b-omni',
  });

  console.log(completion.choices[0].message.content);
}

main();`,

    go: `package main

import (
	"context"
	"fmt"
	"github.com/sashabaranov/go-openai"
)

func main() {
	config := openai.DefaultConfig("anc_live_9942a78f0d8e23b")
	config.BaseURL = "https://api.anacletoai.com/v1"
	client := openai.NewClientWithConfig(config)

	resp, err := client.CreateChatCompletion(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "anacleto-120b-omni",
			Messages: []openai.ChatCompletionMessage{
				{Role: openai.ChatMessageRoleUser, Content: "Analyze code vulnerability."},
			},
		},
	)
	if err != nil {
		return
	}
	fmt.Println(resp.Choices[0].Message.Content)
}`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FFD54F]/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFD54F]/10 border border-[#FFD54F]/30 text-[#FFD54F] text-xs font-semibold uppercase tracking-wider mb-4">
          <Terminal className="w-3.5 h-3.5" />
          Enterprise Developer API
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#F5F5F5] tracking-tight uppercase leading-tight">
          OpenAI-Compatible <br />
          <span className="text-[#FFD54F]">REST API & SDKs.</span>
        </h1>
        <p className="text-[#BDBDBD] text-sm sm:text-base mt-4 leading-relaxed">
          Integrate Anacleto foundation models directly into your enterprise software stacks with zero code rewrites using standard OpenAI client libraries.
        </p>
      </div>

      {/* Playground Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column - Code Generator */}
        <div className="lg:col-span-8 bg-[#1A1A1A] border border-[#333333] rounded-2xl overflow-hidden shadow-2xl">
          {/* Language Tabs */}
          <div className="bg-[#121212] px-4 py-3 border-b border-[#333333] flex items-center justify-between overflow-x-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveLang('python')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  activeLang === 'python' ? 'bg-[#FFD54F] text-black' : 'text-[#BDBDBD] hover:text-white hover:bg-[#252525]'
                }`}
              >
                Python
              </button>
              <button
                onClick={() => setActiveLang('curl')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  activeLang === 'curl' ? 'bg-[#FFD54F] text-black' : 'text-[#BDBDBD] hover:text-white hover:bg-[#252525]'
                }`}
              >
                cURL
              </button>
              <button
                onClick={() => setActiveLang('node')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  activeLang === 'node' ? 'bg-[#FFD54F] text-black' : 'text-[#BDBDBD] hover:text-white hover:bg-[#252525]'
                }`}
              >
                Node.js
              </button>
              <button
                onClick={() => setActiveLang('go')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  activeLang === 'go' ? 'bg-[#FFD54F] text-black' : 'text-[#BDBDBD] hover:text-white hover:bg-[#252525]'
                }`}
              >
                Go
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252525] hover:bg-[#333333] text-[#BDBDBD] hover:text-[#FFD54F] text-xs font-mono transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Code Window */}
          <pre className="p-6 overflow-x-auto text-xs sm:text-sm font-mono text-[#F5F5F5] leading-relaxed bg-[#0D0D0D]">
            <code>{codeSnippets[activeLang]}</code>
          </pre>
        </div>

        {/* Right Column - Endpoint Performance Specs */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#FFD54F]" />
              Inference Specs
            </h3>

            <div className="space-y-3 text-xs text-[#BDBDBD]">
              <div className="flex justify-between border-b border-[#252525] pb-2">
                <span>Primary Model</span>
                <span className="font-mono text-[#FFD54F]">Anacleto-120B-Omni</span>
              </div>
              <div className="flex justify-between border-b border-[#252525] pb-2">
                <span>Token Throughput</span>
                <span className="font-mono text-emerald-400">~140 tokens/sec</span>
              </div>
              <div className="flex justify-between border-b border-[#252525] pb-2">
                <span>Time to First Token (TTFT)</span>
                <span className="font-mono text-emerald-400">22ms</span>
              </div>
              <div className="flex justify-between border-b border-[#252525] pb-2">
                <span>Context Window</span>
                <span className="font-mono text-white">128,000 Tokens</span>
              </div>
              <div className="flex justify-between border-b border-[#252525] pb-2">
                <span>Compliance Protocol</span>
                <span className="font-mono text-white">EU AI Act & GDPR</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 space-y-3">
            <h4 className="text-sm font-bold text-[#F5F5F5] uppercase flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#FFD54F]" />
              Air-Gapped Private Cloud
            </h4>
            <p className="text-xs text-[#BDBDBD] leading-relaxed">
              Every API call is processed on sovereign dedicated nodes in Frankfurt, Germany. Zero external data telemetry or model retraining.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
