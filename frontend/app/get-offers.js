import {backendRequest} from './backend-request';
import {cache} from 'react';

export const getOffers = cache(async () => {
  try {
    const response = await backendRequest('/offers', {
      signal: AbortSignal.timeout(2000),
    });
    if (response.ok) return {offers: await response.json(), available: true};
  } catch {
    // The rest of the homepage is available when the offers endpoint is offline.
  }
  return {offers: [], available: false};
});
