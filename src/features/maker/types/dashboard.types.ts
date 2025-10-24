import type { ReactNode } from 'react';
import type { WindowDto } from '../../../services/makerService';
import type { ActionMessage } from '../../../types/ActionMessage';

export interface Metric {
  label: string;
  value: number | string;
  color: 'fuchsia' | 'green' | 'blue' | 'orange' | 'red' | 'purple';
  icon: ReactNode;
  trend: 'up' | 'down' | 'neutral';
}

export interface DashboardState {
  isLoading: boolean;
  actionMessage: ActionMessage | null;
  currentSection: string;
  assignedWindow: WindowDto | null;
  dashboardMetrics: Metric[];
  branchName: string;
}

export interface DashboardActions {
  handleSectionChange: (sectionId: string) => void;
  handleWindowChange: () => void;
  handleSelectWindow: (window: WindowDto) => Promise<void>;
  setActionMessage: (message: ActionMessage | null) => void;
}