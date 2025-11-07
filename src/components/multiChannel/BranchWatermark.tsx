/**
 * Branch Watermark Component
 * 
 * Displays branch name and access method icon in a semi-transparent
 * watermark at the bottom-right corner of all screens.
 */

import React from 'react';
import type { BranchWatermarkProps } from '@types';
import { ACCESS_METHOD_LABELS, ACCESS_METHOD_ICONS, ACCESS_METHOD_COLORS } from '@constants/multiChannelAccess';
import { useMultiChannelBranch } from '@context/MultiChannelBranchContext';
import './BranchWatermark.css';

/**
 * Branch Watermark Component
 */
export const BranchWatermark: React.FC<BranchWatermarkProps> = ({
  branchName,
  accessMethod,
  position = 'bottom-right',
  className = '',
}) => {
  const icon = ACCESS_METHOD_ICONS[accessMethod];
  const label = ACCESS_METHOD_LABELS[accessMethod];
  const color = ACCESS_METHOD_COLORS[accessMethod];

  const positionClass = `watermark-${position}`;

  return (
    <div 
      className={`branch-watermark ${positionClass} ${className}`}
      style={{ borderColor: color }}
    >
      <div className="watermark-content">
        <span className="watermark-icon" style={{ color }}>
          {icon}
        </span>
        <div className="watermark-text">
          <div className="watermark-branch">{branchName}</div>
          <div className="watermark-method" style={{ color }}>
            {label}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Branch Watermark with Context Hook
 * Automatically gets branch and access method from context
 */
export const BranchWatermarkWithContext: React.FC<{
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}> = ({ position = 'bottom-right', className = '' }) => {
  const { branchContext, accessMethod } = useMultiChannelBranch();

  // Don't render if no branch context or access method
  if (!branchContext || !accessMethod) {
    return null;
  }

  return (
    <BranchWatermark
      branchName={branchContext.branchName}
      accessMethod={accessMethod}
      position={position}
      className={className}
    />
  );
};

export default BranchWatermark;
