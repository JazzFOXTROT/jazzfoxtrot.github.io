import { contacts, resume } from '../content.js';
import { asset, file } from '../asset.js';
import Arrow from '../components/Arrow.jsx';

function TildeLink({ href, children, ...rest }) {
  return (
    <a className="tilde-link serif" href={href} {...rest}>
      <span className="tilde" aria-hidden="true">~</span>
      <span className="tilde-link__label">{children}</span>
      <span className="tilde" aria-hidden="true">~</span>
    </a>
  );
}

export default function Contacts() {
  return (
    <footer id="contacts" className="contacts" aria-labelledby="contacts-title">
      <div className="section-rule section-rule--end">
        <img className="contacts__dots" src={asset('v4/dots.png')} alt="" aria-hidden="true" />
        <span className="section-rule__line" aria-hidden="true" />
        <h2 id="contacts-title" className="contacts__title serif">Contacts</h2>
      </div>
      <p className="contacts__lead">
        Open to UX/UI and Product Design roles, in Israel and abroad. Saw my work and want to collaborate? Email me or reach out on LinkedIn.
      </p>

      <div className="contacts__cta">
        <a className="cta-btn" href={`mailto:${contacts.email}`}>Email me</a>
        <a className="cta-btn cta-btn--ghost" href={file(resume)} target="_blank" rel="noreferrer">Resume (PDF) <Arrow /></a>
      </div>

      <ul className="contacts__list" role="list">
        <li><TildeLink href={`mailto:${contacts.email}`}>{contacts.email}</TildeLink></li>
        <li><TildeLink href={contacts.linkedin} target="_blank" rel="noreferrer">LinkedIn</TildeLink></li>
        <li><TildeLink href={file(resume)} target="_blank" rel="noreferrer">Resume</TildeLink></li>
      </ul>
      <p className="contacts__small">© {new Date().getFullYear()} Kirill Blik</p>
      {/* Figma V4: grainy blue and cream line in the bottom-left corner. */}
      <img className="contacts__line" src={asset('v4/contacts-line.svg')} alt="" aria-hidden="true" />
    </footer>
  );
}
