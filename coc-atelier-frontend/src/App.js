import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom'; // Added useLocation
import AdminDashboard from './pages/AdminDashboard';

// Layout Structural Elements
import Navbar from './components/Navbar'; 
import Hero from './components/Hero';
import ProductTray from './components/ProductTray';
import OurStory from './components/OurStory';
import OrderDrawer from './components/OrderDrawer';

// CHATBOT INTEGRATION
import Chatbot from './components/Chatbot';

// Separate Page Views
import About from './pages/About'; 
import ProductsPage from './pages/ProductsPage'; 

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation(); // Tracks what sub-page path the browser is currently looking at

  // Check if the current route is the owner dashboard path
  const isAdminPage = location.pathname === '/admin';

  // Home layout page loop assembly
  const HomepageLayout = () => (
    <>
      <Hero />
      <ProductTray />
      <OurStory />
    </>
  );

  return (
    <>
      {/* 1. FIXED TOP FRAME: Show only to customers, hide from the owner admin desk */}
      {!isAdminPage && <Navbar onOrderClick={() => setIsCartOpen(true)} />}
      
      {/* 2. DYNAMIC MIDDLE LAYER: Coordinates exactly what page components load */}
      <Routes>
        <Route path="/" element={<HomepageLayout />} />
        <Route path="/about" element={<About />} />
        <Route path="/products" element={<ProductsPage />} />
        
        {/* ADDED: Your secure owner control deck route link is now live! */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>

      {/* FLOATING ACTION TRIGGER BUTTON: Hide completely if on the admin desk page */}
      {!isAdminPage && (
        <button 
          className={`floating-order-trigger ${isCartOpen ? 'hidden-trigger' : ''}`}
          onClick={() => setIsCartOpen(true)}
        >
          <span className="pulse-dot"></span>
          🛒 Order Here
        </button>
      )}

      {/* INTERACTIVE COMPONENT SLIDE DRAWER */}
      <OrderDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* 3. AI CHATBOT INTERACTION: Shows on all shop pages, hidden from admin desk view */}
      {!isAdminPage && <Chatbot />}

      {/* 4. FIXED BOTTOM FRAME: Hide from the admin desk view to maximize display workspace */}
      {!isAdminPage && (
        <footer className="site-footer">
          <p>© 2026 Cake o' Clock Atelier. All Rights Reserved.</p>
        </footer>
      )}
    </>
  );
}

export default App;