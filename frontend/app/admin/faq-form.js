'use client';

import {useState} from 'react';
import Swal from 'sweetalert2';

export default function Admin() {
  const [mode, setMode] = useState('file');
  const [pending, setPending] = useState(false);

  async function save(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const file = data.get('file');
    if (mode === 'file' && file.size > 5 * 1024 * 1024) {
      await Swal.fire({icon: 'error', title: 'Could not update the FAQ', text: 'Choose a PDF no larger than 5 MB.', confirmButtonColor: '#7b362c'});
      return;
    }

    setPending(true);
    try {
      const response = await fetch('/api/admin/faq', {
        method: 'PUT',
        headers: {
          'Content-Type': mode === 'file' ? 'application/pdf' : 'application/json',
          'X-Admin-Password': data.get('password'),
        },
        body: mode === 'file' ? file : JSON.stringify({url: data.get('url')}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result.detail === 'string' ? result.detail : 'Check your input and try again.');
      await Swal.fire({icon: 'success', title: 'FAQ updated', text: result.message, confirmButtonColor: '#185747'});
    } catch (error) {
      await Swal.fire({icon: 'error', title: 'Could not update the FAQ', text: error.message, confirmButtonColor: '#7b362c'});
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="admin">
      <h2>Chatbot FAQ</h2>
      <p>Replace the document the guest assistant uses to answer restaurant questions.</p>
      <a href="/api/faq" target="_blank" rel="noreferrer">View the active FAQ</a>
      <form onSubmit={save}>
        <fieldset disabled={pending}>
          <legend>PDF source</legend>
          <label className="choice"><input type="radio" checked={mode === 'file'} onChange={() => setMode('file')} name="source"/> Upload PDF</label>
          <label className="choice"><input type="radio" checked={mode === 'url'} onChange={() => setMode('url')} name="source"/> Add PDF URL</label>
          {mode === 'file' ? (
            <label className="field">PDF file<input name="file" type="file" accept="application/pdf,.pdf" required/></label>
          ) : (
            <label className="field">Direct HTTPS URL<input name="url" type="url" placeholder="https://example.com/faq.pdf" maxLength={2000} required/></label>
          )}
          <p className="hint">Up to 5 MB and 20 pages. The PDF must contain selectable text.</p>
          <label className="field">Admin password<input name="password" type="password" autoComplete="current-password" required/></label>
          <button className="primary" type="submit">{pending ? 'Validating PDF…' : 'Replace FAQ'}</button>
        </fieldset>
      </form>
    </section>
  );
}
