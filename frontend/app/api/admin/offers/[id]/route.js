import {proxy} from '../../../backend';

export async function DELETE(request, {params}) {
  const {id} = await params;
  if (!/^\d{1,19}$/.test(id)) return new Response(null, {status: 404});
  return proxy(request, `/admin/offers/${id}`);
}
