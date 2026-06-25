"use client";

import { useState, useRef } from "react";
import { siteConfig } from "@/config";

interface PlaylistLoaderProps {
  onPlaylistLoad: (url: string) => void;
  onFileUpload: (file: File) => void;
  defaultUrl: string;
}

export default function PlaylistLoader({
  onPlaylistLoad,
  onFileUpload,
  defaultUrl,
}: PlaylistLoaderProps) {
  const [url, setUrl] = useState(defaultUrl || "");
  const [showInput, setShowInput] = useState(!defaultUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onPlaylistLoad(url.trim());
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-8">
      <div className="glass-card rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Playlist Source</h3>
            <p className="text-xs text-text-secondary mt-0.5">
              {defaultUrl
                ? "Default playlist loaded. You can also use your own."
                : "Enter an M3U/M3U8 URL or upload a file."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-bg-card hover:bg-border rounded-lg transition-colors border border-border"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              Upload File
            </button>
            <button
              onClick={() => setShowInput(!showInput)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                showInput
                  ? "border-accent text-accent bg-accent/10"
                  : "border-border text-text-secondary hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              {showInput ? "Hide URL" : "Enter URL"}
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".m3u,.m3u8,audio/x-mpegurl,application/vnd.apple.mpegurl"
          className="hidden"
          onChange={handleFileChange}
        />

        {showInput && (
          <form onSubmit={handleSubmit} className="flex gap-2 animate-fadeIn">
            <div className="flex-1 relative">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/playlist.m3u8"
                className="w-full bg-bg-secondary border border-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-text-secondary outline-none focus:border-accent/50 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!url.trim()}
              className="px-5 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              Load
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
