import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { UniverseBackground } from '../ui/UniverseBackground';
import { QuickActionFAB } from '../ui/QuickActionFAB';

export const AppLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [gyro, setGyro] = useState({ x: 0, y: 0 });

  // Handle Gyroscope for Android tilt interaction
  useEffect(() => {
    const handleOrientation = (e) => {
      // Gamma: left/right (range -90 to 90)
      // Beta: front/back (range -180 to 180)
      if (typeof e.gamma !== 'number' || typeof e.beta !== 'number') return;
      
      const x = (e.gamma / 45); 
      const y = (e.beta / 90) - 0.5;
      setGyro({ x, y });
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-black font-sans antialiased text-white">
      {/* 
        FLATTENED STACKING CONTEXT:
        1. Sidebar: z-50 (Interactive Layer)
        2. Header: z-40
        3. Main Content: z-10
        4. Mobile Overlay: z-45
        5. Background Engine: z-0 (Bottom Layer)
      */}
      
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      
      <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
      
      <main className="relative z-10 pt-16 lg:pl-64 min-h-screen pointer-events-auto">
        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* High-End 3D Universe Background (Placed at end of DOM for safety) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <UniverseBackground gyro={gyro} />
      </div>

      {/* Mobile Quick Action FAB */}
      <QuickActionFAB />
    </div>
  );
};
