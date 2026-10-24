import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home.jsx';
import Project from './pages/Project.jsx';

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
    </>
  );
}
