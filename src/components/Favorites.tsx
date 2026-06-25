"use client";

import type { Channel } from "@/types";

interface FavoritesProps {
  channels: Channel[];
  favorites: string[];
  onSelectChannel: (channel: Channel) => void;
  onRemoveFavorite: (channelId: string) => void;
}

export default function Favorites({
  channels,
  favorites,
  onSelectChannel,
  onRemoveFavorite,
}: FavoritesProps) {
  const favChannels = channels.filter((ch) => favorites.includes(ch.id));

  if (favChannels.length === 0) return null;

  return (
    <section id="favorites" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-10">
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
        <h2 className="text-lg font-semibold text-white">My Favorites</h2>
        <span className="text-xs text-text-secondary">({favChannels.length})</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {favChannels.map((channel, index) => (
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
              <span className="absolute top-2 left-2 live-badge">LIVE</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFavorite(channel.id);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/20 text-red-500 transition-all opacity-0 group-hover:opacity-100"
                aria-label="Remove from favorites"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-3">
              <h3 className="text-sm font-medium text-white truncate">{channel.name}</h3>
              <p className="text-xs text-text-secondary mt-1 truncate">{channel.category}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
