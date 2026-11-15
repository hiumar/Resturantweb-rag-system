import {backendRequest} from './backend-request';
import {cache} from 'react';
import restaurant from '../restaurant.json';

export const getBranding = cache(async () => {
  try {
    const response = await backendRequest('/branding', {
      signal: AbortSignal.timeout(2000),
    });
    if (response.ok) return await response.json();
  } catch {
    // Render the configured defaults while the backend is offline.
  }
  return {name: restaurant.name, logoVersion: null};
});
