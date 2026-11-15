import Link from 'next/link';
import {getBranding} from '../branding';

export default async function AdminLayout({children}) {
  const {name, logoVersion} = await getBranding();
  return (
    <div lang="en" dir="ltr">
      <header className="admin-header">
        <Link className="wordmark" href="/">
          {logoVersion
            ? <img className="uploaded-logo" src={`/api/branding/logo?v=${logoVersion}`} alt="" width="40" height="40"/>
            : <span className="brand-mark" aria-hidden="true"><i/><b/></span>}
          {name}
        </Link>
        <Link className="admin-link" href="/">Restaurant site</Link>
      </header>
      <div className="admin-content">{children}</div>
    </div>
  );
}
