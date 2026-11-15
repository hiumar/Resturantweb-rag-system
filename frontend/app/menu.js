import {backendRequest} from './backend-request';
import {cache} from 'react';

export const getMenu = cache(async () => {
  try {
    const response = await backendRequest('/menu', {
      signal: AbortSignal.timeout(2000),
    });
    if (response.ok) return {items: await response.json(), available: true};
  } catch {
    // The restaurant homepage can still show its featured dishes while the API is offline.
  }
  return {items: [], available: false};
});
