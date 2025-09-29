import { useState } from "react";
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
    const [comment, setComment] = useState("");

    const submitFeedback = async () => {
        try {
            await axios.post("http://localhost:5268/api/feedback", {
                transactionId,
                frontMakerId,
                branchId,
                customerPhone,
                rating,
                comment,
                ServiceType: transactionType,
                transactionAmount,

            });

            // optional: toast.success("Feedback submitted successfully!");
            onClose();
        } catch (err) {
            console.error("Error submitting feedback:", err);
            // optional: toast.error("Failed to submit feedback");
        }
    };

    if (!isOpen) return null;

    return (
        // <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
        //   <div className="bg-white p-6 rounded-xl shadow-xl w-96 animate-fadeIn">

        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
            <div className="bg-white p-6 rounded-xl shadow-xl w-96 animate-fadeIn">
                <h2 className="text-lg font-bold mb-4">✨ Rate Our Service</h2>

                {/* Show extra transaction info if available */}
                {transactionType && (
                    <p className="text-sm mb-2 text-gray-600">
                        <span className="font-semibold">Type:</span> {transactionType}
                    </p>
                )}
                {transactionAmount && (
                    <p className="text-sm mb-4 text-gray-600">
                        <span className="font-semibold">Amount:</span> {transactionAmount}
                    </p>
                )}
                {message && (
                    <p className="text-sm mb-4 text-fuchsia-700 font-medium">
                        {message}
                    </p>
                )}

                {/* Rating */}
                <div className="flex gap-2 mb-4 justify-center">
                    {[1, 2, 3, 4, 5].map((val) => (
                        <button
                            key={val}
                            onClick={() => setRating(val)}
                            className={`w-10 h-10 rounded-full ${rating >= val ? "bg-yellow-400" : "bg-gray-200"
                                }`}
                        >
                            {val}
                        </button>
                    ))}
                </div>

                {/* Comment */}
                <textarea
                    className="w-full border p-2 rounded mb-4"
                    rows={3}
                    placeholder="Your feedback..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />

                {/* Buttons */}
                <div className="flex justify-end gap-2">
                    <button
                        className="px-4 py-2 bg-gray-300 rounded"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 bg-fuchsia-600 text-white rounded hover:bg-fuchsia-700"
                        onClick={submitFeedback}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
}