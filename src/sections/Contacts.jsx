import { useState } from 'react';
import { contacts } from '../content.js';
import { asset } from '../asset.js';
import Ornament from '../components/Ornament.jsx';

// Static site → the form posts to FormSubmit, which forwards it to Kirill's inbox.
// The very first submission triggers a one-time activation email from FormSubmit.
const ENDPOINT = `https://formsubmit.co/ajax/${contacts.email}`;

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
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error

  const onSubmit = async e => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    if (data._honey) return; // bot
    setStatus('sending');
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          message: data.message,
          _replyto: data.email,
          _subject: `Portfolio: message from ${data.name}`,
          _template: 'box',
          _captcha: 'false',
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus('sent');
      form.reset();
    } catch {
      setStatus('error');
    }
  };

  return (
    <footer id="contacts" className="contacts" aria-labelledby="contacts-title">
      <div className="section-rule section-rule--end">
        <img className="contacts__dots" src={asset('v3/dots.png')} alt="" aria-hidden="true" />
        <span className="section-rule__line" aria-hidden="true" />
        <h2 id="contacts-title" className="contacts__title serif">Contacts</h2>
      </div>
      <p className="contacts__lead">
        Open to UX/UI and Product Design roles, in Israel and abroad. Saw my work and want to collaborate? Leave a message.
      </p>

      <form className="contact-form" onSubmit={onSubmit}>
        <div className="contact-form__row">
          <label className="field">
            <span className="field__label">Name</span>
            <input name="name" type="text" autoComplete="name" required />
          </label>
          <label className="field">
            <span className="field__label">Your mail for contact</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
        </div>
        <label className="field">
          <span className="field__label">Message</span>
          <textarea name="message" rows={5} required />
        </label>
        <input type="text" name="_honey" tabIndex={-1} autoComplete="off" className="visually-hidden" aria-hidden="true" />
        <div className="contact-form__foot">
          <button type="submit" className="contact-form__send" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Send message'}
          </button>
          <p className="contact-form__status" role="status" aria-live="polite">
            {status === 'sent' && 'Thank you! I’ll get back to you soon.'}
            {status === 'error' && (
              <>Something went wrong. Write me directly at <a href={`mailto:${contacts.email}`}>{contacts.email}</a>.</>
            )}
          </p>
        </div>
      </form>

      <ul className="contacts__list" role="list">
        <li><TildeLink href={`mailto:${contacts.email}`}>{contacts.email}</TildeLink></li>
        <li><TildeLink href={contacts.linkedin} target="_blank" rel="noreferrer">LinkedIn</TildeLink></li>
      </ul>
      <p className="contacts__small">© {new Date().getFullYear()} Kirill Blik</p>
      <Ornament corner="bottom-left" className="contacts__ornament" />
    </footer>
  );
}
