import React, { useState, useEffect } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Terminal, 
  Cpu, 
  Zap, 
  Play, 
  Loader2, 
  Key, 
  Plus, 
  Eye, 
  EyeOff, 
  Trash2, 
  Power, 
  AlertCircle, 
  Sparkles,
  Globe,
  Server
} from 'lucide-react';
import { useAuth, ApiKeyItem } from '@/context/AuthContext';

export const ApiPlaygroundView: React.FC = () => {
  const { fetchApiKeys, createApiKey, toggleApiKeyStatus, deleteApiKey } = useAuth();
  
  // API Keys state
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [revealedKeyId, setRevealedKeyId] = useState<string | null>(null);

  // Playground Console state
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('anacleto-medium');
  const [prompt, setPrompt] = useState<string>('Analyze section 4.2 of contract for data compliance risks under the EU AI Act.');
  const [activeLang, setActiveLang] = useState<'python' | 'curl' | 'node' | 'go'>('python');
  const [useCustomDomain, setUseCustomDomain] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);
  const [apiOutput, setApiOutput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string>('');
  const [executionStatus, setExecutionStatus] = useState<number | null>(null);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zzlptwfqqnjhxtvmebqb.supabase.co';
  const directEdgeUrl = `${supabaseUrl}/functions/v1/api_calls`;
  const customDomainUrl = 'https://api.anacletoai.com/v1';

  const activeBaseUrl = useCustomDomain ? customDomainUrl : directEdgeUrl;

  const loadKeys = async () => {
    setLoadingKeys(true);
    const { data, error } = await fetchApiKeys();
    if (!error && data) {
      setKeys(data);
      if (data.length > 0 && !selectedKeyId) {
        setSelectedKeyId(data[0].id);
      }
    }
    setLoadingKeys(false);
  };

  useEffect(() => {
    loadKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setIsCreatingKey(true);
    setKeyError('');

    const { data, error } = await createApiKey(newKeyName.trim());
    if (error) {
      setKeyError(error);
    } else if (data) {
      setKeys(prev => [data, ...prev]);
      if (!selectedKeyId) setSelectedKeyId(data.id);
      setNewKeyName('');
      setRevealedKeyId(data.id);
    }
    setIsCreatingKey(false);
  };

  const handleToggleStatus = async (key: ApiKeyItem) => {
    const nextStatus = key.status === 'active' ? 'disabled' : 'active';
    setKeys(prev => prev.map(k => k.id === key.id ? { ...k, status: nextStatus } : k));
    const { error } = await toggleApiKeyStatus(key.id, key.status);
    if (error) {
      setKeys(prev => prev.map(k => k.id === key.id ? { ...k, status: key.status } : k));
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Applications using this key will immediately lose access.')) return;
    setKeys(prev => prev.filter(k => k.id !== keyId));
    await deleteApiKey(keyId);
    if (selectedKeyId === keyId) {
      const remaining = keys.filter(k => k.id !== keyId);
      setSelectedKeyId(remaining.length > 0 ? remaining[0].id : '');
    }
  };

  const activeKeyObj = keys.find(k => k.id === selectedKeyId) || keys[0];
  const activeKeyValue = activeKeyObj ? activeKeyObj.keyValue : 'anc_live_9495d38a809aed3e';

  const codeSnippets = {
    python: `import openai
import sys

# Anacleto AI Sovereign Endpoint
client = openai.OpenAI(
    base_url="${activeBaseUrl}",
    api_key="${activeKeyValue}"
)

response = client.chat.completions.create(
    model="${selectedModel}",
    messages=[
        {"role": "system", "content": "You are Anacleto AI, a sovereign enterprise model."},
        {"role": "user", "content": "${prompt.replace(/"/g, '\\"')}"}
    ],
    temperature=0.7,
    stream=True
)

for chunk in response:
    if chunk.choices and len(chunk.choices) > 0:
        content = chunk.choices[0].delta.content
        if content:
            sys.stdout.write(content)
            sys.stdout.flush()`,

    curl: `curl -X POST "${activeBaseUrl}/chat/completions" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${activeKeyValue}" \\
  -d '{
    "model": "${selectedModel}",
    "messages": [
      {"role": "system", "content": "You are Anacleto AI, a sovereign enterprise model."},
      {"role": "user", "content": "${prompt.replace(/"/g, '\\"')}"}
    ],
    "temperature": 0.7,
    "stream": true
  }'`,

    node: `import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: '${activeBaseUrl}',
  apiKey: '${activeKeyValue}'
});

async function main() {
  const stream = await openai.chat.completions.create({
    model: '${selectedModel}',
    messages: [{ role: 'user', content: '${prompt.replace(/'/g, "\\'")}' }],
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || '');
  }
}

main();`,

    go: `package main

import (
	"context"
	"fmt"
	"io"
	"github.com/sashabaranov/go-openai"
)

func main() {
	config := openai.DefaultConfig("${activeKeyValue}")
	config.BaseURL = "${activeBaseUrl}"
	client := openai.NewClientWithConfig(config)

	stream, err := client.CreateChatCompletionStream(
		context.Background(),
		openai.ChatCompletionRequest{
			Model: "${selectedModel}",
			Messages: []openai.ChatCompletionMessage{
				{Role: openai.ChatMessageRoleUser, Content: "${prompt.replace(/"/g, '\\"')}"},
			},
			Stream: true,
		},
	)
	if err != nil {
		return
	}
	defer stream.Close()

	for {
		response, err := stream.Recv()
		if err == io.EOF {
			return
		}
		fmt.Print(response.Choices[0].Delta.Content)
	}
}`
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Run real live request to Edge Function
  const handleExecuteLiveCall = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setApiOutput('');
    setExecutionError('');
    setExecutionStatus(null);

    try {
      const response = await fetch(directEdgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKeyValue}`,
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: 'You are Anacleto AI, a sovereign enterprise model.' },
            { role: 'user', content: prompt }
          ],
          stream: true,
          temperature: 0.7
        })
      });

      setExecutionStatus(response.status);

      if (!response.ok) {
        const errorJson = await response.json();
        const msg = errorJson?.error?.message || `HTTP ${response.status} Error`;
        setExecutionError(msg);
        setIsExecuting(false);
        return;
      }

      if (!response.body) {
        setExecutionError('Response body is empty.');
        setIsExecuting(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
              try {
                const parsed = JSON.parse(trimmed.substring(6));
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  setApiOutput(prev => prev + content);
                }
              } catch (e) {
                // Ignore parse errors on partial frames
              }
            }
          }
        }
      }
    } catch (err: any) {
      setExecutionError(err.message || 'Failed to connect to API endpoint.');
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="relative pt-24 pb-20 overflow-hidden">
      {/* Background Ambient Gold Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-[#FFD54F]/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-[#333333] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1A1A1A] border border-[#FFD54F]/40 text-[#FFD54F] text-xs font-semibold shadow-lg shadow-[#FFD54F]/5 mb-3">
              <Code2 className="w-4 h-4 text-[#FFD54F]" />
              <span>Developer API Console</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F5] uppercase tracking-tight">API Keys & REST Playground</h1>
            <p className="text-xs sm:text-sm text-[#BDBDBD] mt-1">Generate developer secrets, manage status, and execute live OpenAI-compatible completions.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-[#1A1A1A] border border-[#333333] text-xs text-[#BDBDBD] font-mono flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Endpoint:</span>
              <span className="text-[#FFD54F] font-bold">{activeBaseUrl}</span>
            </div>
          </div>
        </div>

        {/* SECTION 1: API KEYS MANAGER */}
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 sm:p-8 mb-10 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[#333333] pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                <Key className="w-5 h-5 text-[#FFD54F]" />
                Developer API Keys
              </h2>
              <p className="text-xs text-[#BDBDBD] mt-0.5">Use your secret key to authenticate requests against Anacleto AI foundation models.</p>
            </div>

            {/* New Key Form */}
            <form onSubmit={handleCreateKey} className="flex items-center gap-2">
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key Label (e.g. Production App)"
                className="px-3.5 py-2 rounded-lg bg-[#121212] border border-[#333333] text-[#F5F5F5] placeholder-[#666666] text-xs focus:outline-none focus:border-[#FFD54F] transition-all"
              />
              <button
                type="submit"
                disabled={isCreatingKey || !newKeyName.trim()}
                className="px-4 py-2 rounded-lg bg-[#FFD54F] hover:bg-[#FFCA28] disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 shadow-lg shadow-[#FFD54F]/20"
              >
                {isCreatingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Generate Key
              </button>
            </form>
          </div>

          {keyError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{keyError}</span>
            </div>
          )}

          {/* Keys Table */}
          {loadingKeys ? (
            <div className="py-8 text-center text-xs text-[#666666] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#FFD54F]" />
              Loading API keys from Supabase...
            </div>
          ) : keys.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#BDBDBD] bg-[#121212] rounded-xl border border-[#252525] p-6">
              No API keys generated yet. Enter a label above and click <strong className="text-[#FFD54F]">Generate Key</strong> to create your first secret key.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#BDBDBD]">
                <thead className="bg-[#121212] text-[#FFD54F] font-mono uppercase text-[11px] border-b border-[#333333]">
                  <tr>
                    <th className="p-3">Key Name</th>
                    <th className="p-3">Secret Key (`anc_live_...`)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Created</th>
                    <th className="p-3">Last Used</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#252525]">
                  {keys.map((k) => (
                    <tr key={k.id} className="hover:bg-[#252525]/40 transition-colors">
                      <td className="p-3 font-semibold text-white">{k.keyName}</td>
                      <td className="p-3 font-mono">
                        <div className="flex items-center gap-2">
                          <span>
                            {revealedKeyId === k.id ? k.keyValue : `${k.keyValue.substring(0, 12)}••••••••••••`}
                          </span>
                          <button
                            onClick={() => setRevealedKeyId(revealedKeyId === k.id ? null : k.id)}
                            className="text-[#666666] hover:text-[#F5F5F5] transition-colors"
                            title={revealedKeyId === k.id ? "Hide Secret" : "Reveal Secret"}
                          >
                            {revealedKeyId === k.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(k.keyValue);
                              alert(`API Key copied to clipboard!`);
                            }}
                            className="text-[#666666] hover:text-[#FFD54F] transition-colors"
                            title="Copy API Key"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          k.status === 'active' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${k.status === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                          {k.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[#666666]">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 font-mono text-[#666666]">
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleToggleStatus(k)}
                          className={`p-1.5 rounded transition-colors ${
                            k.status === 'active'
                              ? 'text-amber-400 hover:bg-amber-400/10'
                              : 'text-emerald-400 hover:bg-emerald-400/10'
                          }`}
                          title={k.status === 'active' ? "Disable API Key" : "Enable API Key"}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteKey(k.id)}
                          className="p-1.5 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                          title="Revoke / Delete Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* SECTION 2: INTERACTIVE LIVE API TESTER & CODE SNIPPETS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Left: Code Snippets & Language Switcher */}
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#333333]">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[#FFD54F]" />
                <h3 className="text-base font-bold text-[#F5F5F5] uppercase tracking-wider">SDK & cURL Integration</h3>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 text-xs text-[#FFD54F] hover:underline font-mono"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            {/* Base URL Domain Selector */}
            <div className="mb-4 p-3 rounded-xl bg-[#121212] border border-[#333333]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase text-[#BDBDBD] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#FFD54F]" /> Base URL Routing
                </span>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => setUseCustomDomain(true)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all ${
                      useCustomDomain ? 'bg-[#FFD54F] text-black' : 'text-[#666666] hover:text-white'
                    }`}
                  >
                    Custom Domain
                  </button>
                  <button
                    onClick={() => setUseCustomDomain(false)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase transition-all ${
                      !useCustomDomain ? 'bg-[#FFD54F] text-black' : 'text-[#666666] hover:text-white'
                    }`}
                  >
                    Direct Edge
                  </button>
                </div>
              </div>
            </div>

            {/* Active Key Selector for Snippet */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase text-[#666666] mb-1">Target API Key for Code Snippet</label>
              <select
                value={selectedKeyId}
                onChange={(e) => setSelectedKeyId(e.target.value)}
                className="w-full bg-[#121212] border border-[#333333] rounded-lg p-2.5 text-xs text-[#F5F5F5] focus:border-[#FFD54F] focus:outline-none font-mono"
              >
                {keys.map(k => (
                  <option key={k.id} value={k.id}>
                    {k.keyName} ({k.keyValue.substring(0, 14)}...) - [{k.status.toUpperCase()}]
                  </option>
                ))}
              </select>
            </div>

            {/* Language Tabs */}
            <div className="flex gap-2 mb-4">
              {(['python', 'curl', 'node', 'go'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
                    activeLang === lang 
                      ? 'bg-[#FFD54F] text-black font-bold' 
                      : 'bg-[#121212] text-[#BDBDBD] hover:text-white border border-[#333333]'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Code View */}
            <pre className="p-4 rounded-xl bg-[#121212] border border-[#333333] text-xs font-mono text-[#F5F5F5] overflow-x-auto leading-relaxed max-h-[380px]">
              <code>{codeSnippets[activeLang]}</code>
            </pre>
          </div>

          {/* Right: Live Execution Console */}
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#333333]">
              <h3 className="text-base font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                <Play className="w-5 h-5 text-[#FFD54F]" />
                Live REST Execution
              </h3>
              <span className="text-[11px] font-mono text-[#666666]">HTTP / SSE Stream</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#666666] mb-1">Target Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full bg-[#121212] border border-[#333333] rounded-lg p-2.5 text-xs text-[#F5F5F5] focus:border-[#FFD54F] focus:outline-none font-mono"
                >
                  <option value="anacleto-small">Anacleto Small (7B)</option>
                  <option value="anacleto-medium">Anacleto Medium (30B - Standard)</option>
                  <option value="anacleto-large">Anacleto Large (120B - Frontier)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#666666] mb-1">Prompt Payload</label>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-[#121212] border border-[#333333] rounded-lg p-2.5 text-xs text-[#F5F5F5] focus:border-[#FFD54F] focus:outline-none font-mono resize-none"
                />
              </div>

              <button
                onClick={handleExecuteLiveCall}
                disabled={isExecuting || !activeKeyObj}
                className="w-full py-3.5 px-4 rounded-lg bg-[#FFD54F] hover:bg-[#FFCA28] disabled:opacity-50 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 group shadow-lg shadow-[#FFD54F]/20 cursor-pointer"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    Streaming Output...
                  </>
                ) : (
                  <>
                    Execute API Request
                    <Play className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>

            {/* Console Output Box */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase text-[#666666]">Response Stream Output</span>
                {executionStatus && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    executionStatus === 200 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}>
                    HTTP {executionStatus}
                  </span>
                )}
              </div>

              {executionError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{executionError}</span>
                </div>
              )}

              <div className="p-4 rounded-xl bg-[#121212] border border-[#333333] text-xs font-mono text-[#F5F5F5] min-h-[160px] max-h-[260px] overflow-y-auto leading-relaxed">
                {apiOutput ? (
                  <p className="whitespace-pre-wrap">{apiOutput}</p>
                ) : isExecuting ? (
                  <span className="text-[#666666] animate-pulse">Connecting to Anacleto API Edge...</span>
                ) : (
                  <span className="text-[#666666]">Click 'Execute API Request' to test live response completion.</span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
