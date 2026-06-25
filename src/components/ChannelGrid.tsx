"use client";

import { useMemo } from "react";
import type { Channel } from "@/types";

interface ChannelGridProps {
  channels: Channel[];
  searchQuery: string;
  activeCategory: string;
  favorites: string[];
  onToggleFavorite: (channelId: string) => void;
  onSelectChannel: (channel: Channel) => void;
}

export default function ChannelGrid({
  channels,
  searchQuery,
  activeCategory,
  favorites,
  onToggleFavorite,
  onSelectChannel,
}: ChannelGridProps) {
  const filtered = useMemo(() => {
    return channels.filter((ch) => {
      const matchesSearch =
        !searchQuery ||
        ch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "All" || ch.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [channels, searchQuery, activeCategory]);

  if (channels.length === 0) {
    return (
      <section id="channels" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg className="w-16 h-16 text-text-secondary/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-text-secondary mb-2">No Channels Loaded</h3>
          <p className="text-sm text-text-secondary/60 max-w-md">
            Add a playlist URL above to start watching channels. You can use the default playlist or enter your own M3U/M3U8 URL.
          </p>
        </div>
      </section>
    );
  }

  if (filtered.length === 0) {
    return (
      <section id="channels" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg className="w-16 h-16 text-text-secondary/30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium text-text-secondary mb-2">No Channels Found</h3>
          <p className="text-sm text-text-secondary/60">
            Try adjusting your search or category filter.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="channels" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          {activeCategory === "All" ? "All Channels" : activeCategory}
        </h2>
        <span className="text-xs text-text-secondary">
          {filtered.length} channel{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filtered.map((channel, index) => (
          <div
            key={channel.id}
            className="channel-card group bg-bg-card animate-fadeIn"
            style={{ animationDelay: `${(index % 12) * 50}ms` }}
            onClick={() => onSelectChannel(channel)}
          >
            <div className="relative aspect-video bg-bg-secondary flex items-center justify-center p-4">
              {channel.logo ? (
                <img
                  src={channel.logo}
                  alt={channel.name}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6zm2 2v4h2V8H6zm4 0v4h2V8h-2z" />
                  </svg>
                </div>
              )}
              <div className="absolute top-2 left-2">
                <span className="live-badge">LIVE</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(channel.id);
                }}
                className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${
                  favorites.includes(channel.id)
                    ? "bg-red-500/20 text-red-500"
                    : "bg-black/50 text-white hover:bg-black/70"
                }`}
                aria-label={favorites.includes(channel.id) ? "Remove from favorites" : "Add to favorites"}
              >
                <svg className="w-4 h-4" fill={favorites.includes(channel.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
            <div className="p-3">
              <h3 className="text-sm font-medium text-white truncate">
                {channel.name}
              </h3>
              <p className="text-xs text-text-secondary mt-1 truncate">
                {channel.category}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
