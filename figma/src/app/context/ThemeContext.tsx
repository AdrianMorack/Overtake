import React, { createContext, useContext, useEffect, useState } from 'react';

export type F1Team = 'ferrari' | 'mercedes' | 'redbull' | 'mclaren' | 'alpine' | 'aston-martin' | 'williams';

interface ThemeContextType {
  team: F1Team;
  setTeam: (team: F1Team) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [team, setTeam] = useState<F1Team>('ferrari');

  useEffect(() => {
    // Apply dark mode and team theme
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-team', team);
  }, [team]);

  return (
    <ThemeContext.Provider value={{ team, setTeam }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
