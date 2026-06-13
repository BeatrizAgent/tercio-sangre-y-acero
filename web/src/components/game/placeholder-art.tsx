import React, { useState } from "react";
import { User, Swords, Shield, HeartPulse, Sparkles } from "lucide-react";

export function SoldierPortraitPlaceholder({ className = "w-full h-full" }: { className?: string }) {
  const [error, setError] = useState(false);
  return (
    <div className={`relative flex items-center justify-center overflow-hidden border border-gold/40 bg-radial from-panel-raised to-background ${className}`}>
      {!error ? (
        <img
          src="/assets/generated/portraits/bisono_recruit_v01.png"
          alt="Diego de Arce"
          className="w-full h-full object-cover object-top"
          onError={() => setError(true)}
        />
      ) : (
        <>
          <div className="pointer-events-none absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#d7c29a_1px,_transparent_1px)] bg-[size:4px_4px]" />
          <svg className="w-2/3 h-2/3 text-gold/30 drop-shadow-[0_4px_8px_rgba(201,162,79,0.2)]" viewBox="0 0 100 100" fill="currentColor">
            {/* Helmet Morion outline */}
            <path d="M50 15C32 15 25 35 25 55C25 57 32 59 40 59C42 59 45 42 50 42C55 42 58 59 60 59C68 59 75 57 75 55C75 35 68 15 50 15ZM10 70C25 78 50 82 50 82C50 82 75 78 90 70C95 68 90 64 80 64C72 64 68 66 50 66C32 66 28 64 20 64C10 64 5 68 10 70Z" />
            {/* Cheek guard */}
            <path d="M45 55C45 68 49 72 50 72C51 72 55 68 55 55H45Z" opacity="0.8" />
            {/* Feather plume */}
            <path d="M50 15C52 5 62 2 65 5C68 8 60 15 50 15Z" fill="#8f1f1f" />
          </svg>
        </>
      )}

      <div className="absolute bottom-2 left-2 right-2 border border-gold/20 bg-background/80 px-2 py-1 text-center text-[10px] font-sans tracking-widest text-gold uppercase">
        Diego de Arce
      </div>
    </div>
  );
}

export function MissionRainyWatchPlaceholder({ className = "w-full h-48", missionId }: { className?: string; missionId?: string }) {
  const [error, setError] = useState(false);
  const src = missionId 
    ? `/assets/generated/scenes/${missionId}_v01.png`
    : "/assets/generated/scenes/night_watch_rain_v01.png";

  return (
    <div className={`relative flex flex-col items-center justify-center overflow-hidden border border-iron bg-linear-to-b from-stone-900 to-stone-950 ${className}`}>
      {!error ? (
        <img
          src={src}
          alt="Misión"
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <>
          {/* Rain animation simulation / texture */}
          <div className="pointer-events-none absolute inset-0 opacity-20 bg-[linear-gradient(160deg,_transparent_45%,_#b8a98d_45%,_#b8a98d_55%,_transparent_55%)] bg-[size:10px_30px]" />
          
          {/* Pikes in formation */}
          <svg className="w-1/2 h-1/2 text-stone-600" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="20" y1="90" x2="30" y2="10" />
            <line x1="40" y1="90" x2="45" y2="5" />
            <line x1="60" y1="90" x2="55" y2="5" />
            <line x1="80" y1="90" x2="70" y2="15" />
            
            {/* Spear heads */}
            <path d="M29 15L31 8L33 15" fill="currentColor" stroke="none" />
            <path d="M44 10L46 3L48 10" fill="currentColor" stroke="none" />
            <path d="M54 10L56 3L58 10" fill="currentColor" stroke="none" />
            <path d="M69 20L71 13L73 20" fill="currentColor" stroke="none" />
          </svg>
          
          <div className="absolute inset-0 bg-radial from-transparent to-background/80" />
          <span className="absolute bottom-3 font-cinzel text-xs text-text-muted uppercase tracking-wider">Lluvia y Acero</span>
        </>
      )}
    </div>
  );
}

export function ArmoryInteriorPlaceholder({ className = "w-full h-48" }: { className?: string }) {
  const [error, setError] = useState(false);
  return (
    <div className={`relative flex items-center justify-center overflow-hidden border border-iron bg-linear-to-br from-panel-raised via-stone-900 to-stone-950 ${className}`}>
      {!error ? (
        <img
          src="/assets/generated/scenes/armory_workshop_v01.png"
          alt="Armería Real"
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <>
          {/* Crossed weapons/shield outline */}
          <div className="pointer-events-none absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_#c9a24f_1px,_transparent_1px)] bg-[size:8px_8px]" />
          <svg className="w-1/3 h-1/3 text-gold/20" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 10C25 10 25 45 25 45C25 65 45 85 50 90C55 85 75 65 75 45C75 45 75 10 50 10ZM50 80C45 75 33 60 33 45C33 20 50 20 50 20C50 20 67 20 67 45C67 60 55 75 50 80Z" />
            {/* Swords */}
            <rect x="48" y="-10" width="4" height="120" transform="rotate(45 50 50)" opacity="0.5" />
            <rect x="48" y="-10" width="4" height="120" transform="rotate(-45 50 50)" opacity="0.5" />
          </svg>
          <div className="absolute inset-0 bg-radial from-transparent to-background/90" />
          <span className="absolute bottom-3 font-cinzel text-xs text-text-muted uppercase tracking-wider">Armería Real</span>
        </>
      )}
    </div>
  );
}

export function HospitalSurgeonPlaceholder({ className = "w-full h-48" }: { className?: string }) {
  const [error, setError] = useState(false);
  return (
    <div className={`relative flex items-center justify-center overflow-hidden border border-iron bg-linear-to-tr from-stone-950 via-stone-900 to-panel-raised ${className}`}>
      {!error ? (
        <img
          src="/assets/generated/scenes/hospital_v01.png"
          alt="Hospital de Sangre"
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <>
          <svg className="w-1/4 h-1/4 text-blood/30" viewBox="0 0 100 100" fill="currentColor">
            {/* Red Cross of Burgundy or standard medical silhouette */}
            <path d="M40 10H60V40H90V60H60V90H40V60H10V40H40V10Z" />
          </svg>
          <div className="absolute inset-0 bg-radial from-transparent to-background/90" />
          <span className="absolute bottom-3 font-cinzel text-xs text-text-muted uppercase tracking-wider">Hospital de Sangre</span>
        </>
      )}
    </div>
  );
}
