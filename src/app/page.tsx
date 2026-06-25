"use client";

import { useState, useEffect, useCallback } from "react";
import { siteConfig } from "@/config";
import { fetchPlaylist, parseM3U, generateId } from "@/lib/playlist";
import type { Channel, PlaylistData } from "@/types";
import NoticeBoard from "@/components/NoticeBoard";
import TelegramSection from "@/components/TelegramSection";
import Search from "@/components/Search";
import Categories from "@/components/Categories";
import PlaylistLoader from "@/components/PlaylistLoader";
import ChannelGrid from "@/components/ChannelGrid";
import VideoPlayer from "@/components/VideoPlayer";
import Favorites from "@/components/Favorites";

export default function Home() {
  const [playlist, setPlaylist] = useState<PlaylistData>({
    channels: [],
    categories: [],
  });
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(!!siteConfig.defaultPlaylistUrl);

  useEffect(() => {
    const stored = localStorage.getItem("iptv-favorites");
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (siteConfig.defaultPlaylistUrl) {
      loadPlaylist(siteConfig.defaultPlaylistUrl);
    }
  }, []);

  const loadPlaylist = useCallback(async (url: string) => {
    setLoading(true);
    const data = await fetchPlaylist(url);
    if (data && data.channels.length > 0) {
      const merged = mergeChannels(data.channels, allChannels);
      setAllChannels(merged);
      setPlaylist({
        channels: merged,
        categories: data.categories,
      });
    }
    setLoading(false);
  }, [allChannels]);

  const loadFilePlaylist = useCallback((file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const data = parseM3U(text);
        if (data.channels.length > 0) {
          const merged = mergeChannels(data.channels, allChannels);
          setAllChannels(merged);
          setPlaylist({
            channels: merged,
            categories: mergeCategories(
              data.categories,
              playlist.categories
            ),
          });
        }
      }
      setLoading(false);
    };
    reader.readAsText(file);
  }, [allChannels, playlist.categories]);

  const mergeChannels = (newChs: Channel[], existing: Channel[]): Channel[] => {
    const existingNames = new Set(existing.map((c) => c.name));
    const unique = newChs.filter((c) => !existingNames.has(c.name));
    const merged = [...existing];
    unique.forEach((ch) => {
      merged.push({ ...ch, id: generateId() });
    });
    return merged;
  };

  const mergeCategories = (newCats: string[], existing: string[]): string[] => {
    const set = new Set([...existing, ...newCats]);
    return Array.from(set).sort();
  };

  const handlePlaylistUrl = useCallback((url: string) => {
    loadPlaylist(url);
  }, [loadPlaylist]);

  const handleFileUpload = useCallback((file: File) => {
    loadFilePlaylist(file);
  }, [loadFilePlaylist]);

  const toggleFavorite = useCallback((channelId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId];
      localStorage.setItem("iptv-favorites", JSON.stringify(next));
      return next;
    });
  }, []);

  const selectChannel = useCallback((channel: Channel) => {
    setSelectedChannel(channel);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const closePlayer = useCallback(() => {
    setSelectedChannel(null);
  }, []);

  const displayedChannels = selectedChannel
    ? allChannels
    : playlist.channels;

  return (
    <div className="min-h-screen bg-bg-primary">
      {selectedChannel && (
        <VideoPlayer
          channel={selectedChannel}
          onClose={closePlayer}
        />
      )}

      <NoticeBoard />
      <TelegramSection />

      <PlaylistLoader
        onPlaylistLoad={handlePlaylistUrl}
        onFileUpload={handleFileUpload}
        defaultUrl={siteConfig.defaultPlaylistUrl}
      />

      <Search onSearch={setSearchQuery} />

      <Categories
        categories={playlist.categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {loading && (
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-8">
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-text-secondary">Loading channels...</p>
            </div>
          </div>
        </section>
      )}

      <ChannelGrid
        channels={displayedChannels}
        searchQuery={searchQuery}
        activeCategory={activeCategory}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        onSelectChannel={selectChannel}
      />

      <Favorites
        channels={allChannels}
        favorites={favorites}
        onSelectChannel={selectChannel}
        onRemoveFavorite={(id) => toggleFavorite(id)}
      />

      <footer className="mt-16 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-accent flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6zm2 2v4h2V8H6zm4 0v4h2V8h-2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-white">{siteConfig.name}</span>
            </div>
            <p className="text-xs text-text-secondary">
              &copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
