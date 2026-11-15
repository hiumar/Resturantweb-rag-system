export function backendRequest(path, options = {}) {
  const origin = process.env.CREW_API_URL || 'http://127.0.0.1:8000';
  const headers = new Headers(options.headers);
  if (process.env.CREW_API_TOKEN) {
    headers.set('x-crew-api-token', process.env.CREW_API_TOKEN);
  }
  return fetch(new URL(path, origin), {...options, headers, cache: 'no-store'});
}
