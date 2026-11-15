import {proxy} from '../backend';

export function GET(request) {
  return proxy(request, '/faq');
}
