import React, { useState } from 'react';
import { X, Star, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

export const WriteReviewModal = ({ isOpen, onClose, onSubmitReview }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (onSubmitReview) {
        await onSubmitReview({
          id: `r-${Date.now()}`,
          author: 'Verified Consumer',
          badge: 'On-Chain Verified',
          rating,
          comment,
          date: 'Just now'
        });
      }
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setComment('');
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Review submit failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF7F0] rounded-3xl w-full max-w-sm p-5 border border-[#E6E1D5] shadow-2xl flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-[#E6E1D5]">
          <h3 className="font-extrabold text-sm text-[#2D2620] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#354424]" />
            <span>Write a Verified Review</span>
          </h3>
          <button onClick={onClose} className="text-[#666057] hover:text-[#2D2620] cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-[#2D2620]">Review Recorded!</h4>
              <p className="text-xs text-[#666057] mt-1">
                Your feedback has been verified and permanently anchored on-chain.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 items-center">
              <span className="text-xs font-semibold text-[#666057]">Overall Freshness Rating</span>
              <div className="flex items-center gap-1.5 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    onClick={() => setRating(star)}
                    className={`w-6 h-6 cursor-pointer transition-transform hover:scale-110 ${
                      star <= rating ? 'fill-amber-500 text-amber-500' : 'text-[#E6E1D5]'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#2D2620]">Your Feedback</label>
              <textarea
                rows={3}
                placeholder="Tell us about the freshness, quality, and packaging..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-white border border-[#E6E1D5] rounded-2xl p-3 text-xs font-medium text-[#2D2620] focus:outline-none focus:border-[#354424]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="w-full py-3 bg-[#354424] text-white text-xs font-extrabold rounded-2xl shadow-xs hover:bg-[#2D3B1E] transition-all cursor-pointer mt-1 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Submitting Review...</span>
                </>
              ) : (
                <span>Submit Verified Review</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

