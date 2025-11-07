import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  StarIcon, 
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import axios from "axios";

interface TransactionFeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: string;
    branchId?: string;
    frontMakerId?: string;
    customerPhone?: string;
    transactionType?: string;
    transactionAmount?: string | number;
    message?: string;
}

export default function TransactionFeedbackModal({
    isOpen,
    onClose,
    transactionId,
    branchId,
    frontMakerId,
    customerPhone,
    transactionType,
    transactionAmount,
    message,
}: TransactionFeedbackModalProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const submitFeedback = async () => {
        if (rating === 0) {
            setError('Please select a rating before submitting.');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                TransactionId: transactionId,
                ServiceType: transactionType || 'General Service',
                Rating: rating,
                Comment: comment.trim() || null,
                FrontMakerId: frontMakerId,
                BranchId: branchId,
                CustomerPhone: customerPhone || 'anonymous'
            };

            console.log('Submitting feedback payload:', payload);

            const response = await axios.post("http://localhost:5268/api/feedback", payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Feedback submitted successfully:', response.data);
            setIsSubmitted(true);
            
            // Auto-close after showing success
            setTimeout(() => {
                handleClose();
            }, 2000);
        } catch (err: any) {
            console.error("Error submitting feedback:", err);
            console.error("Error response:", err.response?.data);
            
            const errorMessage = err.response?.data?.message || 
                               err.response?.data?.Message || 
                               err.message || 
                               'Failed to submit feedback. Please try again.';
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setRating(0);
        setHoveredRating(0);
        setComment('');
        setIsSubmitted(false);
        setError(null);
        onClose();
    };

    const getRatingLabel = (stars: number) => {
        switch (stars) {
            case 1: return 'Poor';
            case 2: return 'Fair';
            case 3: return 'Good';
            case 4: return 'Very Good';
            case 5: return 'Excellent';
            default: return 'Rate your experience';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {isSubmitted ? (
                            // Success State
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-8 text-center"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                    className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"
                                >
                                    <CheckCircleIcon className="h-10 w-10 text-green-600" />
                                </motion.div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h3>
                                <p className="text-gray-600">Your feedback has been submitted successfully.</p>
                            </motion.div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="bg-gradient-to-r from-fuchsia-700 to-fuchsia-600 p-6 relative">
                                    <button
                                        onClick={handleClose}
                                        className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
                                    >
                                        <XMarkIcon className="h-5 w-5 text-white" />
                                    </button>
                                    
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                                            <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-xl">Transaction Complete!</h3>
                                            <p className="text-fuchsia-100 text-sm">Rate your experience</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 space-y-5">
                                    {/* Transaction Info */}
                                    {(transactionType || transactionAmount) && (
                                        <div className="bg-gradient-to-r from-fuchsia-50 to-purple-50 rounded-xl p-4 border border-fuchsia-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <BanknotesIcon className="h-5 w-5 text-fuchsia-700" />
                                                <span className="text-sm font-semibold text-gray-700">Transaction Details</span>
                                            </div>
                                            {transactionType && (
                                                <p className="text-sm text-gray-700">
                                                    <span className="font-medium">Type:</span> {transactionType}
                                                </p>
                                            )}
                                            {transactionAmount && (
                                                <p className="text-sm text-gray-700">
                                                    <span className="font-medium">Amount:</span> ETB {Number(transactionAmount).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Custom Message */}
                                    {message && (
                                        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-lg">
                                            <p className="text-sm text-blue-800 font-medium">{message}</p>
                                        </div>
                                    )}

                                    {/* Star Rating */}
                                    <div className="text-center">
                                        <p className="text-sm text-gray-600 mb-3 font-medium">How was your service today?</p>
                                        <div className="flex justify-center gap-2 mb-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <motion.button
                                                    key={star}
                                                    whileHover={{ scale: 1.2 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => setRating(star)}
                                                    onMouseEnter={() => setHoveredRating(star)}
                                                    onMouseLeave={() => setHoveredRating(0)}
                                                    className="focus:outline-none transition-transform"
                                                >
                                                    {star <= (hoveredRating || rating) ? (
                                                        <StarSolidIcon className="h-10 w-10 text-yellow-400" />
                                                    ) : (
                                                        <StarIcon className="h-10 w-10 text-gray-300" />
                                                    )}
                                                </motion.button>
                                            ))}
                                        </div>
                                        <p className="text-sm font-semibold text-fuchsia-600 h-5">
                                            {getRatingLabel(hoveredRating || rating)}
                                        </p>
                                    </div>

                                    {/* Comments */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Additional Comments (Optional)
                                        </label>
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            rows={4}
                                            maxLength={500}
                                            placeholder="Share your thoughts or suggestions..."
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent resize-none text-sm"
                                        />
                                        <p className="text-xs text-gray-500 mt-1 text-right">
                                            {comment.length}/500
                                        </p>
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-red-50 border border-red-200 rounded-lg p-3"
                                        >
                                            <p className="text-sm text-red-600">{error}</p>
                                        </motion.div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleClose}
                                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                        >
                                            Skip
                                        </button>
                                        <button
                                            onClick={submitFeedback}
                                            disabled={isSubmitting || rating === 0}
                                            className="flex-1 bg-gradient-to-r from-fuchsia-700 to-fuchsia-600 hover:from-fuchsia-800 hover:to-fuchsia-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}