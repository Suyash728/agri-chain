import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search } from 'lucide-react';

export const CategoriesView = ({ onBack, onSelectCategory }) => {
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/consumer/products')
      .then((res) => res.json())
      .then((products) => {
        if (Array.isArray(products)) {
          const counts = {};
          products.forEach((p) => {
            const cat = p.category || 'vegetables';
            counts[cat] = (counts[cat] || 0) + 1;
          });
          setCategories([
            { id: 'all', name: 'All Products', count: products.length, image: '/images/vegetables_ref.png' },
            { id: 'vegetables', name: 'Fresh Vegetables', count: counts['vegetables'] || 0, image: '/images/vegetables_ref.png' },
            { id: 'fruits', name: 'Seasonal Fruits', count: counts['fruits'] || 0, image: '/images/fruits_ref.png' },
            { id: 'dairy', name: 'Dairy & Farm Fresh', count: counts['dairy'] || 0, image: '/images/coins_kpi.png' },
            { id: 'grains', name: 'Organic Grains', count: counts['grains'] || 0, image: '/images/grains_ref.png' }
          ]);
        }
      })
      .catch(() => {});
  }, []);

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-3 pb-20 md:pb-8 pt-2">
      <div className="px-4 md:px-8 flex flex-col gap-4 mt-2 max-w-7xl mx-auto w-full">
        {/* Title & Search Bar Input */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <h2 className="text-lg md:text-xl font-black text-[#2D2620]">All Categories</h2>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#666057] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-[#E6E1D5] text-xs font-semibold text-[#2D2620] placeholder-[#666057] focus:outline-none focus:border-[#354424]"
            />
          </div>
        </div>

        {/* 2-Column on Mobile, 4-Column on Desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className="bg-white rounded-2xl p-4 md:p-6 border border-[#E6E1D5] shadow-xs flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#354424] hover:shadow-md transition-all group"
            >
              <div className="w-16 md:w-24 h-16 md:h-24 rounded-2xl bg-[#FAF7F0] flex items-center justify-center p-2 mb-3 group-hover:scale-105 transition-transform">
                <img src={cat.image} alt={cat.name} className="max-h-full max-w-full object-contain mix-blend-multiply" />
              </div>
              <h4 className="font-extrabold text-xs md:text-sm text-[#2D2620] leading-tight mb-1">
                {cat.name}
              </h4>
              <span className="text-[10px] md:text-xs font-semibold text-[#666057]">
                {cat.count} items
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
