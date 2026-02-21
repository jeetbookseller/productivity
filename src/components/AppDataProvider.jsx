import React from 'react';
import { AppDataContext, useAppData } from '../hooks/useAppData.js';

export function AppDataProvider({ children }) {
  const data = useAppData();
  return (
    <AppDataContext.Provider value={data}>
      {children}
    </AppDataContext.Provider>
  );
}
