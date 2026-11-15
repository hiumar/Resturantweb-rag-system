'use client';

import {useRouter} from 'next/navigation';
import {useState} from 'react';
import Swal from 'sweetalert2';

export default function BrandingForm({currentName}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function save(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const updatingName = data.has('name');
    const logo = data.get('logo');
    if (logo && logo.size > 2 * 1024 * 1024) {
      await Swal.fire({icon: 'error', title: 'Could not save branding', text: 'Choose a logo no larger than 2 MB.', confirmButtonColor: '#7b362c'});
      return;
    }

    setPending(true);
    try {
      const response = await fetch('/api/admin/branding', {
        method: 'PUT',
        headers: {
          'Content-Type': updatingName ? 'application/json' : 'application/octet-stream',
          'X-Admin-Password': data.get('password'),
        },
        body: updatingName ? JSON.stringify({name: data.get('name')}) : logo,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : 'Check your input and try again.');
      if (!updatingName) form.reset();
      router.refresh();
      await Swal.fire({icon: 'success', title: updatingName ? 'Restaurant name saved' : 'Restaurant logo uploaded', text: result.message, confirmButtonColor: '#185747'});
    } catch (error) {
      await Swal.fire({icon: 'error', title: 'Could not save branding', text: error.message, confirmButtonColor: '#7b362c'});
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="admin branding-settings" id="branding-settings">
      <h2>Restaurant branding</h2>
      <form onSubmit={save}>
        <fieldset disabled={pending}>
          <legend>Restaurant name</legend>
          <label className="field">Display name<input name="name" defaultValue={currentName} maxLength={80} required/></label>
          <label className="field">Admin password<input name="password" type="password" autoComplete="current-password" required/></label>
          <button className="primary">Save name</button>
        </fieldset>
      </form>
      <form onSubmit={save}>
        <fieldset disabled={pending}>
          <legend>Restaurant logo</legend>
          <label className="field">Logo file<input name="logo" type="file" accept="image/png,image/jpeg,image/webp" required/></label>
          <p className="hint">PNG, JPEG, or WebP up to 2 MB.</p>
          <label className="field">Admin password<input name="password" type="password" autoComplete="current-password" required/></label>
          <button className="primary">Upload logo</button>
        </fieldset>
      </form>
    </section>
  );
}
