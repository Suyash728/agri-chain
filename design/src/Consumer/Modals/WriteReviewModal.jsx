import React, { useState } from 'react';
import { X, Star } from 'lucide-react';

export const WriteReviewModal = ({ isOpen, onClose, onSubmitReview }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    onSubmitReview({
      id: `r-${Date.now()}`,
      author: 'Rahul Patil',
      badge: 'Verified Buyer',
      rating,
      comment,
      date: 'Just now'
    });

    setComment('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF7F0] rounded-3xl w-full max-w-sm p-5 border border-[#E6E1D5] shadow-2xl flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b border-[#E6E1D5]">
          <h3 className="font-extrabold text-sm text-[#2D2620]">Write a Review</h3>
          <button onClick={onClose} className="text-[#666057] hover:text-[#2D2620]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 items-center">
            <span className="text-xs font-semibold text-[#666057]">Overall Rating</span>
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
              placeholder="Tell us about the freshness, taste, and packaging..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-white border border-[#E6E1D5] rounded-2xl p-3 text-xs font-medium text-[#2D2620] focus:outline-none focus:border-[#354424]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#354424] text-white text-xs font-extrabold rounded-2xl shadow-xs hover:bg-[#2D3B1E] transition-all cursor-pointer mt-1"
          >
            Submit Review
          </button>
        </form>
      </div>
    </div>
  );
};
