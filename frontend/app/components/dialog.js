'use client';

import {useEffect, useId, useRef} from 'react';
import {useTranslations} from 'next-intl';
import {X} from 'lucide-react';

export default function Dialog({title, open, onClose, children, drawer = false}) {
  const t = useTranslations();
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className={drawer ? 'store-dialog drawer' : 'store-dialog'} aria-labelledby={titleId}
      onCancel={event => {event.preventDefault(); onClose();}}
      onClick={event => {if (event.target === event.currentTarget) onClose();}}>
      <div className="dialog-content">
        <div className="dialog-heading"><h2 id={titleId}>{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label={t('close')}><X size={20}/></button></div>
        {children}
      </div>
    </dialog>
  );
}
