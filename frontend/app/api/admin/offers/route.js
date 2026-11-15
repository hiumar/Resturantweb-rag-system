import {proxy} from '../../backend';

export function POST(request) {
  return proxy(request, '/admin/offers');
}
