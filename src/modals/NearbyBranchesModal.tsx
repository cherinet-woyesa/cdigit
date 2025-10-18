import { XMarkIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "react-i18next";

interface NearbyBranchesModalProps {
  isOpen: boolean;
  onClose: () => void;
  loadingNearbyBranches: boolean;
  nearbyBranches: any[];
  queueCounts: Record<string, number>;
  fetchNearbyBranches: () => void;
}

export default function NearbyBranchesModal({
  isOpen,
  onClose,
  loadingNearbyBranches,
  nearbyBranches,
  queueCounts,
  fetchNearbyBranches,
}: NearbyBranchesModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-fuchsia-700 text-white rounded-3xl shadow-2xl max-w-2xl w-full mx-4 p-6 relative transform transition-all duration-300 scale-100 hover:scale-[1.01]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white hover:text-gray-200 rounded-full p-1 hover:bg-white/20 transition"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-4">
          {t('nearbyBranches', 'Nearby Branches')}
        </h2>

        {/* Content */}
        <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
          {loadingNearbyBranches ? (
            <div className="text-white text-center py-8">
              {t('loadingNearbyBranches', 'Loading nearby branches...')}
            </div>
          ) : nearbyBranches.length === 0 ? (
            <div className="text-white text-center py-8">
              <p className="mb-4">{t('noNearbyBranches', 'No nearby branches found')}</p>
              <button
                onClick={fetchNearbyBranches}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                {t('tryAgain', 'Try Again')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {nearbyBranches.map((branch) => (
                <div 
                  key={branch.id} 
                  className="bg-white/30 backdrop-blur-sm rounded-lg p-4 text-white"
                >
                  <div className="font-semibold text-sm truncate">{branch.name}</div>
                  <div className="text-xs opacity-90 truncate">{branch.address}</div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs">
                      {branch.distance.toFixed(1)} km
                    </span>
                    <span className="bg-white text-fuchsia-700 rounded-full px-2 py-0.5 text-xs font-bold">
                      {queueCounts[branch.id] !== undefined ? queueCounts[branch.id] : '...'} {t('inQueue', 'in queue')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}