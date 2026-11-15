import {backendRequest} from '../backend-request';

export async function proxy(request, path) {
  const headers = new Headers();
  for (const name of ['content-type', 'x-admin-password']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  try {
    const upstream = await backendRequest(path, {
      method: request.method,
      headers,
      body: request.body,
      duplex: 'half',
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
