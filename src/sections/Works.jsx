import { useNavigate } from 'react-router-dom';
import { projects, works } from '../content.js';
import { asset } from '../asset.js';
import { navigateWithTransition } from '../transition.js';

export default function Works() {
  const navigate = useNavigate();

  return (
    <section id="works" className="works" aria-labelledby="works-title">
      <header className="works__head">
        <h2 id="works-title" className="works__title serif">My works</h2>
        <p className="works__lines">{works.lines}</p>
      </header>

      <ul className="stack" role="list">
        {projects.map((p, i) => (
          <li key={p.slug} className="stack__item" style={{ '--i': i, '--n': projects.length }}>
            <a
              href={`#/work/${p.slug}`}
              className="stack__card"
              onClick={e => {
                e.preventDefault();
                navigateWithTransition(navigate, `/work/${p.slug}`, e.currentTarget);
              }}
            >
              <img src={asset(`img/${p.card}`)} alt="" loading="lazy" width="517" height="569" />
              <span className="visually-hidden">{p.name}: {p.cardTitle}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
