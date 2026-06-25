export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return Response.json({ error: "Missing url parameter" }, { status: 400 });
  }

  const proxyUrl = `/api/stream?url=${encodeURIComponent(url)}`;

  const manifest = `#EXTM3U
#EXT-X-PLAYLIST-TYPE:EVENT
#EXT-X-TARGETDURATION:10
#EXT-X-VERSION:3
#EXTINF:10.0,
${proxyUrl}
#EXTINF:10.0,
${proxyUrl}
#EXTINF:10.0,
${proxyUrl}
#EXTINF:10.0,
${proxyUrl}
#EXTINF:10.0,
${proxyUrl}`;

  return new Response(manifest, {
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache",
    },
  });
}
