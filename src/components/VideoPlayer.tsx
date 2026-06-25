"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Channel } from "@/types";

interface VideoPlayerProps {
  channel: Channel | null;
  onClose: () => void;
}

interface QualityLevel {
  index: number;
  label: string;
  width: number;
  height: number;
  bitrate: number;
  fps?: number;
}

export default function VideoPlayer({ channel, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any>(null);
  const mpegtsRef = useRef<any>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showVolume, setShowVolume] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const [buffering, setBuffering] = useState(true);
  const [showQuality, setShowQuality] = useState(false);
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (playing) setControlsVisible(false);
    }, 3000);
  }, [playing]);

  useEffect(() => {
    if (!channel || !videoRef.current) return;

    const video = videoRef.current;
    const url = channel.url;

    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (mpegtsRef.current) { mpegtsRef.current.destroy(); mpegtsRef.current = null; }

    setPlaybackError("");
    setPlaying(false);
    setBuffering(true);
    setQualityLevels([]);
    setCurrentQuality(-1);

    const isM3u = url.includes(".m3u8") || url.includes(".m3u");
    const isTs = url.endsWith(".ts");

    console.log("[VideoPlayer] Loading:", url.substring(0, 100), { isM3u, isTs });

    const playWithHls = (src: string) => {
      import("hls.js").then((HlsModule) => {
        const Hls = HlsModule.default;
        if (!Hls.isSupported()) {
          video.src = src;
          video.load();
          return;
        }
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 10,
          maxMaxBufferLength: 30,
          startLevel: -1,
          abrEwmaDefaultEstimate: 500000,
          testBandwidth: true,
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        hlsRef.current = hls;

        hls.on(Hls.Events.MANIFEST_PARSED, (_e: any, data: any) => {
          console.log("[VideoPlayer] HLS levels:", data.levels?.length);
          const levels: QualityLevel[] = data.levels.map((l: any, i: number) => ({
            index: i,
            label: l.height ? `${l.height}p` : `Level ${i}`,
            width: l.width || 0,
            height: l.height || 0,
            bitrate: l.bitrate || 0,
            fps: l.attrs?.["FRAME-RATE"] ? parseFloat(l.attrs["FRAME-RATE"]) : undefined,
          }));
          setQualityLevels(levels);
          video.play().then(() => { setPlaying(true); setBuffering(false); }).catch(() => setPlaying(false));
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_e: any, data: any) => {
          setCurrentQuality(data.level);
        });

        hls.on(Hls.Events.ERROR, (_event: any, data: any) => {
          console.error("[VideoPlayer] HLS error:", data.type, data.details, data.fatal);
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              setPlaybackError("Network error - stream server may be offline.");
              hls.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              setPlaybackError("Playback error - stream format unsupported.");
              hls.recoverMediaError();
            } else {
              setPlaybackError("Failed to play this channel.");
              hls.destroy();
            }
          }
        });
      });
    };

    const playViaProxy = (streamUrl: string) => {
      const proxySrc = `/api/stream?url=${encodeURIComponent(streamUrl)}`;
      console.log("[VideoPlayer] Using mpegts.js for:", streamUrl.substring(0, 80));

      import("mpegts.js").then((mpegtsModule) => {
        const mpegts = mpegtsModule.default;
        if (mpegts.isSupported()) {
          const player = mpegts.createPlayer({
            type: "mpegts",
            url: proxySrc,
          }, {
            liveBufferLatencyChasing: true,
            liveBufferLatencyMaxLatency: 3,
            liveBufferLatencyMinRemain: 1,
            autoCleanupSourceBuffer: true,
          });
          player.attachMediaElement(video);
          player.load();
          mpegtsRef.current = player;

          player.on(mpegts.Events.ERROR, (errorType: string, errorDetail: string) => {
            console.error("[VideoPlayer] mpegts error:", errorType, errorDetail);
            setPlaybackError("Failed to play this channel. Stream may be offline.");
          });

          player.on(mpegts.Events.LOADING_COMPLETE, () => {
            setPlaying(false);
          });

          video.play().then(() => { setPlaying(true); setBuffering(false); }).catch(() => setPlaying(false));
        } else {
          video.src = proxySrc;
          video.load();
          video.play().then(() => { setPlaying(true); setBuffering(false); }).catch(() => setPlaying(false));
        }
      }).catch(() => {
        video.src = proxySrc;
        video.load();
        video.play().then(() => { setPlaying(true); setBuffering(false); }).catch(() => setPlaying(false));
      });
    };

    const onWaiting = () => setBuffering(true);
    const onPlaying = () => { setBuffering(false); setPlaying(true); };
    video.addEventListener("waiting", onWaiting);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("canplay", () => setBuffering(false));

    if (isM3u) {
      playWithHls(url);
    } else if (isTs) {
      playViaProxy(url);
    } else {
      playWithHls(url);
    }

    showControls();

    return () => {
      video.removeEventListener("waiting", onWaiting);
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("canplay", () => setBuffering(false));
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      if (mpegtsRef.current) { mpegtsRef.current.destroy(); mpegtsRef.current = null; }
      video.removeAttribute("src");
      video.load();
    };
  }, [channel?.id]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play().catch(() => {}); setPlaying(true); }
    showControls();
  }, [playing, showControls]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
    showControls();
  }, [muted, showControls]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setVolume(val);
    setMuted(val === 0);
  }, []);

  const setQuality = useCallback((index: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = index;
      setCurrentQuality(index);
    }
    setShowQuality(false);
    showControls();
  }, [showControls]);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
    showControls();
  }, [showControls]);

  const togglePiP = useCallback(async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await videoRef.current.requestPictureInPicture();
    } catch {}
    showControls();
  }, [showControls]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!channel) return;
      switch (e.key) {
        case " ": e.preventDefault(); togglePlay(); break;
        case "f": toggleFullscreen(); break;
        case "m": toggleMute(); break;
        case "Escape": fullscreen ? toggleFullscreen() : onClose(); break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [channel, togglePlay, toggleFullscreen, toggleMute, fullscreen, onClose]);

  useEffect(() => () => { if (controlsTimeout.current) clearTimeout(controlsTimeout.current); }, []);

  if (!channel) return null;

  const currentLevel = qualityLevels.find((l) => l.index === currentQuality);

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-8">
      <div
        ref={containerRef}
        className="relative bg-black rounded-xl overflow-hidden group"
        onMouseMove={showControls}
        onMouseEnter={() => setControlsVisible(true)}
        onMouseLeave={() => playing && setControlsVisible(false)}
      >
        <video
          ref={videoRef}
          className="w-full aspect-video bg-black cursor-pointer"
          onClick={togglePlay}
          playsInline
          onPlay={() => { setPlaying(true); setBuffering(false); setPlaybackError(""); }}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onError={(e) => {
            const el = e.target as HTMLVideoElement;
            const code = el.error?.code;
            console.error("[VideoPlayer] Video error:", code, el.error?.message);
            const map: Record<number, string> = { 1: "Playback aborted.", 2: "Network error.", 3: "Stream could not be decoded.", 4: "Format not supported." };
            setPlaybackError((code != null ? map[code] : null) || "Failed to play.");
          }}
        ></video>

        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 transition-opacity duration-300 ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`} />

        {/* Loading spinner */}
        {buffering && !playbackError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-3 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-white/80">Loading stream...</p>
            </div>
          </div>
        )}

        {/* Top bar */}
        <div className={`absolute top-4 left-4 right-4 flex items-start justify-between transition-opacity duration-300 ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <div className="flex items-center gap-3">
            {channel.logo && (
              <img src={channel.logo} alt="" className="w-8 h-8 rounded object-contain bg-black/50 p-1" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            )}
            <div>
              <h3 className="text-sm font-medium text-white">{channel.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">{channel.category}</span>
                {currentLevel && (
                  <span className="text-xs text-accent font-medium">
                    {currentLevel.label} {currentLevel.fps ? `${currentLevel.fps}fps` : ""} {(currentLevel.bitrate / 1000).toFixed(0)}kbps
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors" aria-label="Close player">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Error */}
        {playbackError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="text-center px-6">
              <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              <p className="text-sm text-red-300">{playbackError}</p>
            </div>
          </div>
        )}

        {/* Play button */}
        {!playing && !playbackError && !buffering && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button onClick={togglePlay} className="w-16 h-16 rounded-full bg-accent/90 hover:bg-accent flex items-center justify-center transition-transform hover:scale-110 animate-glow">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.14-5.89a1.5 1.5 0 000-2.54L6.3 2.84z" /></svg>
            </button>
          </div>
        )}

        {/* Bottom controls */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 transition-opacity duration-300 ${controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={togglePlay} className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors" aria-label={playing ? "Pause" : "Play"}>
                {playing ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                )}
              </button>

              <div className="relative" onMouseEnter={() => setShowVolume(true)} onMouseLeave={() => setShowVolume(false)}>
                <button onClick={toggleMute} className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors" aria-label={muted ? "Unmute" : "Mute"}>
                  {muted || volume === 0 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" /></svg>
                  )}
                </button>
                {showVolume && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-bg-secondary border border-border rounded-lg animate-fadeIn">
                    <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={handleVolumeChange} className="w-20 h-1 accent-accent cursor-pointer rotate-0" style={{ writingMode: "horizontal-tb" }} />
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Quality selector */}
              {qualityLevels.length > 1 && (
                <div className="relative">
                  <button
                    onClick={() => setShowQuality(!showQuality)}
                    className="px-2 py-1 rounded-lg text-xs font-medium text-white bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    {currentQuality === -1 ? "Auto" : currentLevel?.label || "HD"}
                    {currentLevel?.fps ? ` ${currentLevel.fps}fps` : ""}
                  </button>
                  {showQuality && (
                    <div className="absolute bottom-full right-0 mb-2 bg-bg-secondary border border-border rounded-lg overflow-hidden animate-fadeIn min-w-[160px]">
                      <button
                        onClick={() => setQuality(-1)}
                        className={`w-full px-3 py-2 text-left text-xs hover:bg-white/10 transition-colors ${currentQuality === -1 ? "text-accent font-medium" : "text-white"}`}
                      >
                        Auto
                      </button>
                      {qualityLevels.map((level) => (
                        <button
                          key={level.index}
                          onClick={() => setQuality(level.index)}
                          className={`w-full px-3 py-2 text-left text-xs hover:bg-white/10 transition-colors flex items-center justify-between ${currentQuality === level.index ? "text-accent font-medium" : "text-white"}`}
                        >
                          <span>{level.label} {level.fps ? `${level.fps}fps` : ""}</span>
                          <span className="text-text-secondary">{(level.bitrate / 1000).toFixed(0)}k</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button onClick={togglePiP} className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors hidden sm:block" aria-label="Picture in picture">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm8 4h6v6h-6v-6z" /></svg>
              </button>
              <button onClick={toggleFullscreen} className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors" aria-label="Fullscreen">
                {fullscreen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
