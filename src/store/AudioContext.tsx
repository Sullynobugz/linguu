import { createContext, useContext, useState } from 'react';

interface AudioCtx {
  muted: boolean;
  toggle: () => void;
}

const Ctx = createContext<AudioCtx>({ muted: false, toggle: () => {} });

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [muted, setMuted] = useState(false);
  return (
    <Ctx.Provider value={{ muted, toggle: () => setMuted(m => !m) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAudio = () => useContext(Ctx);
