import React from 'react';
import { ShoppingBag, Truck, Clock, CheckCircle2 } from 'lucide-react';

export const RecentActivity = ({ activities, onViewAll }) => {
  return (
    <div className="bg-white border border-[#E6E1D5] rounded-2xl p-4 sm:p-5 flex flex-col justify-between overflow-hidden relative shadow-xs">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-extrabold text-[#3B3028]">
            Recent Activity
          </h2>
          <button 
            onClick={onViewAll}
            className="text-xs sm:text-sm font-bold text-[#556B2F] hover:text-[#3D4E2A] transition-colors"
          >
            View All
          </button>
        </div>

        {/* Vertical Activity Timeline List */}
        <div className="flex flex-col gap-3 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-[#E6E1D5]">
          {activities.map((item) => {
            let Icon = ShoppingBag;
            let iconBg = "bg-[#FAF7F0] text-[#556B2F]";
            let badgeClass = "badge-confirmed";

            if (item.type === 'shipment') {
              Icon = Truck;
              iconBg = "bg-[#FFF4EC] text-[#B85C38]";
              badgeClass = "badge-intransit";
            } else if (item.statusType === 'pending') {
              Icon = Clock;
              iconBg = "bg-[#FFFDF0] text-[#8C6B16]";
              badgeClass = "badge-pending";
            } else if (item.type === 'payment') {
              Icon = CheckCircle2;
              iconBg = "bg-[#F0F7E6] text-[#3D5220]";
              badgeClass = "badge-confirmed";
            }

            return (
              <div 
                key={item.id} 
                className="flex items-center justify-between z-10 p-2.5 rounded-xl hover:bg-[#FAF7F0]/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-[#E6E1D5] ${iconBg} shadow-2xs`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#3B3028]">
                      {item.title}
                    </h4>
                    <span className="text-[11px] font-semibold text-[#786E65]">
                      {item.date}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-block ${badgeClass}`}>
                    {item.status}
                  </span>
                  {item.amount && item.type === 'payment' && (
                    <span className="text-xs font-extrabold text-[#3B3028] block mt-0.5">
                      {item.amount}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Decorative Farm Landscape Artwork at bottom with Seamless Top Fade */}
      <div className="mt-4 -mx-5 -mb-5 relative h-28 overflow-hidden rounded-b-2xl">
        <img 
          src="/images/farm_landscape_bg_1786284404903.jpg" 
          alt="Lush green farm hills" 
          className="w-full h-full object-cover object-bottom"
        />
        {/* Soft top gradient to fade hills into white card background */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-white/50 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
};
