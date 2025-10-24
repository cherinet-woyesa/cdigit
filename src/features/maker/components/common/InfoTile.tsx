import React from 'react';
import { motion } from 'framer-motion';

export interface InfoTileProps {
  label: string;
  value: string | number;
  highlight?: 'default' | 'amount' | 'account' | 'type';
  index?: number;
  className?: string;
}

const InfoTile: React.FC<InfoTileProps> = ({
  label,
  value,
  highlight = 'default',
  index = 0,
  className = ''
}) => {
  const getTileClasses = () => {
    const baseClasses = "w-full rounded-lg p-2 shadow-sm transition hover:shadow";
    
    switch (highlight) {
      case 'amount':
        return `${baseClasses} bg-emerald-50`;
      case 'account':
        return `${baseClasses} bg-indigo-50`;
      case 'type':
        return `${baseClasses} bg-purple-50`;
      default:
        return `${baseClasses} bg-gray-50`;
    }
  };

  const getValueClasses = () => {
    const baseClasses = "font-semibold break-all text-sm";
    
    switch (highlight) {
      case 'amount':
        return `${baseClasses} font-bold text-emerald-700 text-base`;
      case 'account':
        return `${baseClasses} font-mono font-semibold text-indigo-700 text-sm`;
      case 'type':
        return `${baseClasses} font-bold text-purple-700 uppercase tracking-wide text-sm`;
      default:
        return baseClasses;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ scale: 1.02 }}
      className={`${getTileClasses()} ${className}`}
    >
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <motion.div
        className={getValueClasses()}
        animate={highlight === "amount" ? { scale: [1, 1.05, 1] } : {}}
        transition={
          highlight === "amount"
            ? { repeat: Infinity, repeatDelay: 3, duration: 1.2 }
            : {}
        }
      >
        {value}
      </motion.div>
    </motion.div>
  );
};

export default InfoTile;