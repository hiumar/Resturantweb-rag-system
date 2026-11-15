import {cache} from 'react';

export const getOffers = cache(async () => {
  try {
    const origin = process.env.CREW_API_URL || 'http://127.0.0.1:8000';
    const response = await fetch(new URL('/offers', origin), {
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    });
    if (response.ok) return {offers: await response.json(), available: true};
  } catch {
    // The rest of the homepage is available when the offers endpoint is offline.
  }
  return {offers: [], available: false};
});
