import {cache} from 'react';

export const getMenu = cache(async () => {
  try {
    const origin = process.env.CREW_API_URL || 'http://127.0.0.1:8000';
    const response = await fetch(new URL('/menu', origin), {
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    });
    if (response.ok) return {items: await response.json(), available: true};
  } catch {
    // The restaurant homepage can still show its featured dishes while the API is offline.
  }
  return {items: [], available: false};
});
