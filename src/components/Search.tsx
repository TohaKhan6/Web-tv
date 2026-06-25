"use client";

import { useState, useRef } from "react";

interface SearchProps {
  onSearch: (query: string) => void;
}

export default function Search({ onSearch }: SearchProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
    inputRef.current?.focus();
  };

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto mt-8">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-accent-hover rounded-2xl opacity-20 group-focus-within:opacity-40 blur transition-opacity" />
        <div className="relative flex items-center bg-bg-secondary border border-border rounded-xl group-focus-within:border-accent/50 transition-colors">
          <svg
            className="ml-4 w-5 h-5 text-text-secondary shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Search channels, categories, sports..."
            className="flex-1 bg-transparent border-none outline-none px-3 py-4 text-white placeholder-text-secondary text-sm"
          />
          {query && (
            <button
              onClick={handleClear}
              className="mr-2 p-1.5 rounded-lg hover:bg-bg-card text-text-secondary hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
