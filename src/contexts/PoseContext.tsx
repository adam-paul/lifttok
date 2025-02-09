import React, { createContext, useContext } from 'react';
import type { UsePoseDataResult } from '../utils/pose-data';
import { usePoseData } from '../utils/pose-data';

const PoseContext = createContext<UsePoseDataResult | null>(null);

export function PoseProvider({ children }: { children: React.ReactNode }) {
  const poseData = usePoseData();

  return (
    <PoseContext.Provider value={poseData}>
      {children}
    </PoseContext.Provider>
  );
}

export function usePoseContext(): UsePoseDataResult {
  const context = useContext(PoseContext);
  if (!context) {
    throw new Error('usePoseContext must be used within a PoseProvider');
  }
  return context;
} 