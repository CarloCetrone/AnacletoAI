import React, { useState } from 'react';
import { X, Copy, Check, Download, ExternalLink, Code2, Eye } from 'lucide-react';

interface ArtifactCanvasProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: 'code' | 'html' | 'svg' | 'markdown';
  content: string;
}

export const ArtifactCanvas: React.FC<ArtifactCanvasProps> = ({
  isOpen,
  onClose,
  title,
  type,
  content
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, '_') || 'artifact'}.${type === 'html' ? 'html' : type === 'svg' ? 'svg' : 'txt'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full lg:w-[480px] xl:w-[540px] h-full bg-[#1A1A1A] border-l border-[#333333] flex flex-col justify-between flex-shrink-0 z-30 shadow-2xl animate-in slide-in-from-right duration-300">
      
      {/* Canvas Top Bar */}
      <div className="h-12 border-b border-[#333333] bg-[#121212] px-4 flex items-center justify-between text-xs text-[#BDBDBD]">
        <div className="flex items-center gap-2 truncate">
          <Code2 className="w-4 h-4 text-[#FFD54F]" />
          <span className="font-bold text-[#F5F5F5] truncate">{title || 'Interactive Artifact'}</span>
          <span className="bg-[#252525] text-[#FFD54F] px-2 py-0.5 rounded text-[10px] font-mono uppercase">
            {type}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {type === 'html' || type === 'svg' ? (
            <div className="flex items-center bg-[#1A1A1A] border border-[#333333] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  viewMode === 'preview' ? 'bg-[#FFD54F] text-black' : 'text-[#BDBDBD] hover:text-white'
                }`}
              >
                <Eye className="w-3 h-3" />
                Preview
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`px-2 py-1 rounded text-[11px] font-semibold transition-all flex items-center gap-1 ${
                  viewMode === 'code' ? 'bg-[#FFD54F] text-black' : 'text-[#BDBDBD] hover:text-white'
                }`}
              >
                <Code2 className="w-3 h-3" />
                Source
              </button>
            </div>
          ) : null}

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg hover:bg-[#252525] text-[#BDBDBD] hover:text-[#FFD54F] transition-colors"
            title="Copy Content"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg hover:bg-[#252525] text-[#BDBDBD] hover:text-[#FFD54F] transition-colors"
            title="Download Artifact File"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#252525] text-[#BDBDBD] hover:text-white transition-colors"
            title="Close Canvas"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Main Body */}
      <div className="flex-1 overflow-auto p-4 bg-[#0D0D0D]">
        {type === 'html' && viewMode === 'preview' ? (
          <iframe
            srcDoc={content}
            className="w-full h-full rounded-xl bg-white border-0 shadow-inner"
            title="HTML Preview"
            sandbox="allow-scripts"
          />
        ) : type === 'svg' && viewMode === 'preview' ? (
          <div 
            className="w-full h-full flex items-center justify-center p-4 bg-[#121212] rounded-xl border border-[#252525]"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <pre className="p-4 text-xs font-mono text-[#F5F5F5] leading-relaxed overflow-x-auto">
            <code>{content}</code>
          </pre>
        )}
      </div>

      {/* Canvas Footer */}
      <div className="p-3 border-t border-[#333333] bg-[#121212] text-[11px] text-[#BDBDBD] flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[#FFD54F]">
          <Code2 className="w-3.5 h-3.5" />
          Anacleto Artifact Engine Active
        </span>
        <span>{content.length.toLocaleString()} characters</span>
      </div>

    </div>
  );
};
