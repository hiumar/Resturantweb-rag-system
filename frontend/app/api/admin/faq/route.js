import {proxy} from '../../backend';

export function PUT(request) {
  return proxy(request, '/admin/faq');
}
