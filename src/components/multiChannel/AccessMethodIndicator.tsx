/**
 * Access Method Indicator Component
 * 
 * Displays the current access method (Mobile App, Branch Tablet, or QR Code)
 * with color-coding and branch information in the application header.
 */

import React from 'react';
import type { AccessMethodIndicatorProps } from '@types';
import { 
  ACCESS_METHOD_LABELS, 
  ACCESS_METHOD_ICONS, 
  ACCESS_METHOD_COLORS 
} from '@constants/multiChannelAccess';
import { useMultiChannelBranch } from '@context/MultiChannelBranchContext';
import './AccessMethodIndicator.css';

/**
 * Access Method Indicator Component
 */
export const AccessMethodIndicator: React.FC<AccessMethodIndicatorProps> = ({
  accessMethod,
  branchName,
  showBranchWatermark: _showBranchWatermark = false,
  className = '',
}) => {
  const icon = ACCESS_METHOD_ICONS[accessMethod];
  const label = ACCESS_METHOD_LABELS[accessMethod];
  const color = ACCESS_METHOD_COLORS[accessMethod];

  return (
    <div 
      className={`access-method-indicator ${className}`}
      style={{ borderLeftColor: color }}
    >
      <div className="indicator-icon" style={{ color }}>
        {icon}
      </div>
      <div className="indicator-content">
        <div className="indicator-label" style={{ color }}>
          {label}
        </div>
        {branchName && (
          <div className="indicator-branch">
            {branchName}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Access Method Indicator with Context
 * Automatically gets access method and branch from context
 */
export const AccessMethodIndicatorWithContext: React.FC<{
  showBranchWatermark?: boolean;
  className?: string;
}> = ({ showBranchWatermark = false, className = '' }) => {
  const { branchContext, accessMethod } = useMultiChannelBranch();

  // Don't render if no access method
  if (!accessMethod) {
    return null;
  }

  return (
    <AccessMethodIndicator
      accessMethod={accessMethod}
      branchName={branchContext?.branchName}
      showBranchWatermark={showBranchWatermark}
      className={className}
    />
  );
};

/**
 * Compact Access Method Badge
 * Smaller version for use in tight spaces
 */
export const AccessMethodBadge: React.FC<{
  accessMethod: AccessMethodIndicatorProps['accessMethod'];
  className?: string;
}> = ({ accessMethod, className = '' }) => {
  const icon = ACCESS_METHOD_ICONS[accessMethod];
  const label = ACCESS_METHOD_LABELS[accessMethod];
  const color = ACCESS_METHOD_COLORS[accessMethod];

  return (
    <div 
      className={`access-method-badge ${className}`}
      style={{ backgroundColor: color }}
      title={label}
    >
      <span className="badge-icon">{icon}</span>
      <span className="badge-label">{label}</span>
    </div>
  );
};

/**
 * Access Method Icon Only
 * Just the icon for minimal display
 */
export const AccessMethodIcon: React.FC<{
  accessMethod: AccessMethodIndicatorProps['accessMethod'];
  size?: 'small' | 'medium' | 'large';
  className?: string;
}> = ({ accessMethod, size = 'medium', className = '' }) => {
  const icon = ACCESS_METHOD_ICONS[accessMethod];
  const label = ACCESS_METHOD_LABELS[accessMethod];
  const color = ACCESS_METHOD_COLORS[accessMethod];

  const sizeClass = `icon-${size}`;

  return (
    <div 
      className={`access-method-icon ${sizeClass} ${className}`}
      style={{ color }}
      title={label}
    >
      {icon}
    </div>
  );
};

export default AccessMethodIndicator;
