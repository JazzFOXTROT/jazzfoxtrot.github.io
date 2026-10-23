import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home.jsx';
import Project from './pages/Project.jsx';
import GradualBlur from './components/reactbits/GradualBlur.jsx';

export default function App() {
  const { pathname } = useLocation();
  const onProject = pathname.startsWith('/work/');

  useEffect(() => {
    if (onProject) window.scrollTo(0, 0);
  }, [pathname, onProject]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/work/:slug" element={<Project />} />
        <Route path="*" element={<Home />} />
      </Routes>
      {/* Soft blur at the bottom edge of the screen, on every page */}
      <GradualBlur target="page" position="bottom" height="5rem" strength={1.6} layers={6} curve="bezier" exponential zIndex={40} />
    </>
  );
}
