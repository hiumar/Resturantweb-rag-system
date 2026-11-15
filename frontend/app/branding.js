import {cache} from 'react';
import restaurant from '../restaurant.json';

export const getBranding = cache(async () => {
  try {
    const origin = process.env.CREW_API_URL || 'http://127.0.0.1:8000';
    const response = await fetch(new URL('/branding', origin), {
      cache: 'no-store',
      signal: AbortSignal.timeout(2000),
    });
    if (response.ok) return await response.json();
  } catch {
    // Render the configured defaults while the backend is offline.
  }
  return {name: restaurant.name, logoVersion: null};
});
