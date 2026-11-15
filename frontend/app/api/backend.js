export async function proxy(request, path) {
  const origin = process.env.CREW_API_URL || 'http://127.0.0.1:8000';
  const headers = new Headers();
  for (const name of ['content-type', 'x-admin-password']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const upstream = await fetch(new URL(path, origin), {
      method: request.method,
      headers,
      body: request.body,
      duplex: 'half',
      cache: 'no-store',
      signal: AbortSignal.timeout(90_000),
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {'Content-Type': upstream.headers.get('Content-Type'), 'Cache-Control': 'no-store'},
    });
  } catch {
    return Response.json({detail: 'The restaurant service is unavailable. Try again shortly.'}, {status: 502});
  }
}
