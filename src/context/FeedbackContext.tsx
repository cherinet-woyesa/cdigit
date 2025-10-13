import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import TransactionFeedbackModal from '../modals/TransactionFeedbackModal';

interface FeedbackContextType {
  showFeedback: (params: {
    transactionId: string;
    branchId?: string;
    frontMakerId?: string;
    customerPhone?: string;
    transactionType?: string;
    transactionAmount?: string | number;
    message?: string;
  }) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

interface FeedbackParams {
  transactionId: string;
  branchId?: string;
  frontMakerId?: string;
  customerPhone?: string;
  transactionType?: string;
  transactionAmount?: string | number;
  message?: string;
}

export const FeedbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isFeedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackParams, setFeedbackParams] = useState<FeedbackParams | null>(null);

  const showFeedback = useCallback((params: FeedbackParams) => {
    setFeedbackParams(params);
    setFeedbackModalOpen(true);
  }, []);

  const closeFeedback = useCallback(() => {
    setFeedbackModalOpen(false);
    setFeedbackParams(null);
  }, []);

  return (
    <FeedbackContext.Provider value={{ showFeedback }}>
      {children}
      {feedbackParams && (
        <TransactionFeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={closeFeedback}
          transactionId={feedbackParams.transactionId}
          branchId={feedbackParams.branchId}
          frontMakerId={feedbackParams.frontMakerId}
          customerPhone={feedbackParams.customerPhone}
          transactionType={feedbackParams.transactionType}
          transactionAmount={feedbackParams.transactionAmount}
          message={feedbackParams.message}
        />
      )}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = (): FeedbackContextType => {
  const context = useContext(FeedbackContext);
  if (context === undefined) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

export default FeedbackContext;