import { useEffect, useRef } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import RouteEffects from './components/RouteEffects.jsx';
import Home from './pages/Home.jsx';
import Work from './pages/Work.jsx';
import Services from './pages/Services.jsx';
import Academy from './pages/Academy.jsx';
import Checkout from './pages/Checkout.jsx';
import NotFound from './pages/NotFound.jsx';
import { startSmoothScroll } from './lib/motion.js';

export default function App() {
  const { pathname } = useLocation();
  /* The opening sequence plays once, and only when the visit starts on the home page. */
  const startedOnHome = useRef(pathname === '/');

  useEffect(() => { startSmoothScroll(); }, []);

  return (
    <>
      <RouteEffects />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home intro={startedOnHome.current} />} />
          <Route path="/work" element={<Work />} />
          <Route path="/services" element={<Services />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
