import { bring } from '../content.js';

export default function Bring() {
  return (
    <section className="bring" aria-labelledby="bring-title">
      <h2 id="bring-title" className="bring__title">What I bring to the table</h2>
      <ol className="bring__list" role="list">
        {bring.map(b => (
          <li key={b.n} className="bring__item">
            <span className="bring__n">{b.n}</span>
            <h3 className="bring__name serif">{b.title}</h3>
            <p className="bring__text">{b.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
