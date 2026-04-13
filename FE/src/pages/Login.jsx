import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Wallet } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { UniverseBackground } from '../components/ui/UniverseBackground';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [gyro, setGyro] = useState({ x: 0, y: 0 });

  // Handle Gyroscope for Android tilt interaction (Mobile Cosmos experience)
  useEffect(() => {
    const handleOrientation = (e) => {
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

  const handleSuccess = async (credentialResponse) => {
    setErrorMsg('');
    try {
      await login(credentialResponse.credential);
      navigate('/');
    } catch (error) {
      console.error(error);
      setErrorMsg('Unauthorized context. Ensure this origin is whitelisted in Google Console.');
    }
  };

  const handleError = () => {
    console.log('Google Login Failed');
    setErrorMsg('Security handshake failed or context was cancelled.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden font-sans">
      {/* Immersive 3D Universe Background (Shared with Dashboard) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <UniverseBackground gyro={gyro} />
      </div>

      {/* Cinematic Login Card Entrance */}
      <div className="glass-card w-full max-w-md p-10 relative z-10 flex flex-col items-center bg-white/[0.01] backdrop-blur-xl border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 slide-in-from-bottom-5 duration-1000">
        <div className="mb-8 relative group">
          <div className="absolute inset-0 bg-primary-500/20 blur-2xl rounded-full group-hover:bg-primary-500/40 transition-all duration-700 animate-pulse" />
          <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl relative z-10">
            <Wallet size={36} className="text-primary-400" />
          </div>
        </div>
        
        <h1 className="text-4xl font-heading font-black text-white mb-2 tracking-[0.1em] uppercase">
          Family <span className="text-primary-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">Fin</span>
        </h1>
        <p className="text-slate-500 mb-10 text-center text-xs font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[280px]">
          Precision Analytics <span className="text-slate-700">|</span> Unified Growth
        </p>
        
        <div className="w-full flex flex-col items-center mb-6">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            theme="filled_black"
            size="large"
            shape="pill"
            text="signin_with"
            logo_alignment="left"
          />
          
          {/* Helper for dynamic tunnels (ngrok/cloudflare) */}
          <div className="mt-10 p-4 rounded-xl bg-white/[0.02] border border-white/5 text-[9px] text-slate-600 text-center max-w-[260px] leading-relaxed">
            <p className="font-black uppercase tracking-widest mb-1.5 text-primary-500/60">Deployment Matrix</p>
            Whitelist <span className="text-slate-400 select-all font-mono">{window.location.origin}</span> in your Google Cloud Console to enable mobile access.
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-400 font-bold uppercase tracking-wider w-full text-center animate-in shake duration-500">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
};
