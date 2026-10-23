import { contacts } from '../content.js';

export default function Contacts() {
  return (
    <footer id="contacts" className="contacts" aria-labelledby="contacts-title">
      <h2 id="contacts-title" className="contacts__title serif">Contacts</h2>
      <p className="contacts__lead">Open to UX/UI and Product Design roles, in Israel and abroad. Write me.</p>
      <ul className="contacts__list" role="list">
        <li><a className="tilde-link serif" href={`mailto:${contacts.email}`}><span className="tilde" aria-hidden="true">~</span><span className="tilde-link__label">{contacts.email}</span><span className="tilde" aria-hidden="true">~</span></a></li>
        <li><a className="tilde-link serif" href={contacts.linkedin} target="_blank" rel="noreferrer"><span className="tilde" aria-hidden="true">~</span><span className="tilde-link__label">LinkedIn</span><span className="tilde" aria-hidden="true">~</span></a></li>
      </ul>
      <p className="contacts__small">© {new Date().getFullYear()} Kirill Blik</p>
    </footer>
  );
}
