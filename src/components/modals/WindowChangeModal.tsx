// c:/Users/chereto/Desktop/cbe/CBEDIGITAL/src/components/modals/WindowChangeModal.tsx
import React, { useState, useEffect } from 'react';
import type { WindowDto } from '@services/makerService';
import { XMarkIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import makerService from '@services/makerService';

interface WindowChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWindow: (window: WindowDto) => void;
  branchId: string | null;
}

const WindowChangeModal: React.FC<WindowChangeModalProps> = ({ isOpen, onClose, onSelectWindow, branchId }) => {
  const [windows, setWindows] = useState<WindowDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWindows = async () => {
      if (!isOpen || !branchId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found.');
          setLoading(false);
          return;
        }
        
        const data = await makerService.getWindowsByBranchId(branchId, token);
        setWindows(data || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch windows. Please try again.');
        setLoading(false);
        console.error(err);
      }
    };

    fetchWindows();
  }, [isOpen, branchId]);

  if (!isOpen) {
    return null;
  }

  const handleSelect = (selectedWindow: WindowDto) => {
    onSelectWindow(selectedWindow);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Select a Window</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-4">
          {loading && <p>Loading windows...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {windows.map(win => (
                <button
                  key={win.id}
                  onClick={() => handleSelect(win)}
                  className="p-4 border rounded-lg text-center hover:bg-fuchsia-100 hover:bg-fuchsia-500 transition-colors"
                >
                  <ComputerDesktopIcon className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-semibold">Window {win.windowNumber}</p>
                  <p className="text-xs text-gray-500">{win.windowType}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WindowChangeModal;