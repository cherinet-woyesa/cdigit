import { useState } from 'react';
import { workflowRoutingService, type WorkflowActionType } from '@services/workflowRoutingService';
import toast from 'react-hot-toast';

interface WorkflowActionDropdownProps {
  voucherId: string;
  serviceName: string;
  currentStage?: string;
  onSuccess?: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * WorkflowActionDropdown Component
 * 
 * A reusable dropdown component that displays 5 workflow actions
 * (ToAuthorizer, ToPreAuthorizer, ToAuditor, ToPreAuditor, ToKYC)
 * and allows users to send vouchers to different approval stages.
 * 
 * @param voucherId - The voucher ID to route
 * @param serviceName - The service name (e.g., "Deposits", "Withdrawals")
 * @param currentStage - Current workflow stage (optional, for filtering actions)
 * @param onSuccess - Callback function called after successful routing
 * @param disabled - Whether the dropdown is disabled
 * @param className - Additional CSS classes
 */
export default function WorkflowActionDropdown({
  voucherId,
  serviceName,
  currentStage,
  onSuccess,
  disabled = false,
  className = ''
}: WorkflowActionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<WorkflowActionType | null>(null);

  // Get available workflow actions
  const actions = workflowRoutingService.getAvailableActions(currentStage as any);

  const handleActionSelect = async (actionValue: WorkflowActionType) => {
    setSelectedAction(actionValue);
    setIsOpen(false);
    setLoading(true);

    try {
      const response = await workflowRoutingService.sendToStage({
        voucherId,
        serviceName,
        action: actionValue
      });

      if (response.success) {
        const action = workflowRoutingService.getActionByValue(actionValue);
        toast.success(`Voucher sent ${action?.label || 'successfully'}!`);
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(response.message || 'Failed to send voucher');
      }
    } catch (error: any) {
      console.error('Error sending voucher to stage:', error);
      toast.error(error.message || 'Error sending voucher');
    } finally {
      setLoading(false);
      setSelectedAction(null);
    }
  };

  const handleToggle = () => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Close dropdown when clicking outside
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} onBlur={handleBlur}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2 px-4 py-2 
          text-sm font-medium rounded-lg transition-all duration-200
          ${
            disabled || loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-fuchsia-600 text-white hover:bg-fuchsia-700 active:bg-fuchsia-800 shadow-sm hover:shadow-md'
          }
        `}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Sending...</span>
          </>
        ) : (
          <>
            <span>Send</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {/* Dropdown Menu - Positioned to the left */}
      {isOpen && !loading && (
        <div
          className="absolute left-0 bottom-full z-50 mb-2 w-72 origin-bottom-left rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1">
            {/* Dropdown Header */}
            <div className="px-3 py-1.5 border-b border-gray-200 bg-gray-50">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Route Voucher
              </p>
            </div>

            {/* Action Options */}
            {actions.map((action) => (
              <button
                key={action.value}
                onClick={() => handleActionSelect(action.value)}
                disabled={selectedAction === action.value}
                className={`
                  w-full text-left px-3 py-2 transition-colors duration-150
                  hover:bg-fuchsia-50 focus:bg-fuchsia-50 focus:outline-none border-b border-gray-100 last:border-0
                  ${selectedAction === action.value ? 'opacity-50 cursor-wait' : ''}
                `}
                role="menuitem"
              >
                <div className="flex items-center gap-2">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-fuchsia-100 flex items-center justify-center">
                      <span className="text-fuchsia-600 text-xs font-bold">
                        {action.label.charAt(3)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {action.label}
                    </p>
                    <p className="text-xs text-gray-500 leading-tight">
                      {action.description}
                    </p>
                  </div>

                  {/* Arrow Icon */}
                  <div className="flex-shrink-0">
                    <svg
                      className="w-3.5 h-3.5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
