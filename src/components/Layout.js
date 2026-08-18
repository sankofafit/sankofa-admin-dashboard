import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children, session }) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main)',
        position: 'relative',
      }}
    >
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setSidebarOpen(false)}
          role="button"
          tabIndex={0}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 99,
          }}
        />
      )}

      <Sidebar isOpen={sidebarOpen} isMobile={isMobile} onClose={() => setSidebarOpen(false)} />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: !isMobile && sidebarOpen ? 260 : 0,
          transition: 'margin-left 0.3s ease',
          minHeight: '100vh',
          width: '100%',
          backgroundColor: 'var(--bg-main)',
          overflow: 'auto',
        }}
      >
        <Header session={session} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main
          style={{
            flex: 1,
            padding: isMobile ? 16 : 24,
            overflowY: 'auto',
            overflowX: 'hidden',
            backgroundColor: 'var(--bg-main)',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
