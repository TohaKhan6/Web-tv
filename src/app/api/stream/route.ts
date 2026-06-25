export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return Response.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "VLC/3.0.21 LibVLC/3.0.21",
        "Icy-Meta": "0",
      },
    });

    if (!upstream.ok || !upstream.body) {
      return new Response(`Stream server returned ${upstream.status}`, { status: 502 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "video/mp2t",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-store",
      },
    });
  } catch {
    return new Response("Stream server unreachable", { status: 502 });
  }
}
