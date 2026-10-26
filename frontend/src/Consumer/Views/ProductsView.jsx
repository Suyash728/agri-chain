import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, Plus, Star } from 'lucide-react';

export const ProductsView = ({ onAddToCart, onProductClick, initialCategory = 'all', searchQuery: externalSearchQuery = '' }) => {
  const [selectedFilter, setSelectedFilter] = useState(initialCategory);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (initialCategory) setSelectedFilter(initialCategory);
  }, [initialCategory]);

  const activeSearch = externalSearchQuery || localSearchQuery;

  const fetchProducts = () => {
    fetch('http://localhost:8000/consumer/products')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          // Deduplicate by product name so each product appears only once
          const uniqueList = Array.from(new Map(data.map(p => [p.name, p])).values());
          setProducts(uniqueList);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchProducts();
    const handleUpdate = () => fetchProducts();
    window.addEventListener('agrichain-data-updated', handleUpdate);
    window.addEventListener('agrichain-data-reset', handleUpdate);
    return () => {
      window.removeEventListener('agrichain-data-updated', handleUpdate);
      window.removeEventListener('agrichain-data-reset', handleUpdate);
    };
  }, []);

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'fruits', label: 'Fruits' },
    { id: 'vegetables', label: 'Vegetables' },
    { id: 'grains', label: 'Grains' },
    { id: 'pulses', label: 'Pulses & Legumes' },
    { id: 'dairy', label: 'Dairy & Eggs' },
    { id: 'spices', label: 'Spices' },
    { id: 'dryfruits', label: 'Dry Fruits & Nuts' }
  ];

  const getFilteredProducts = () => {
    let list = selectedFilter === 'all' 
      ? products 
      : products.filter(p => (p.category || '').toLowerCase() === selectedFilter.toLowerCase());

    if (activeSearch && activeSearch.trim()) {
      const q = activeSearch.toLowerCase().trim();
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.origin && p.origin.toLowerCase().includes(q))
      );
    }
    return list;
  };

  const filteredProducts = getFilteredProducts();

  return (
    <div className="flex flex-col gap-3 pb-20 md:pb-8 pt-2">
      <div className="px-4 md:px-8 flex flex-col gap-4 mt-2 max-w-7xl mx-auto w-full">
        {/* Filter Pills Row */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {filterTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  selectedFilter === tab.id
                    ? 'bg-[#354424] text-white shadow-xs'
                    : 'bg-white border border-[#E6E1D5] text-[#666057] hover:text-[#2D2620]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="hidden md:block text-xs font-extrabold text-[#666057]">
            Showing {filteredProducts.length} items
          </span>
        </div>

        {/* Product List: Mobile row list, Desktop 4-col cards grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-[#E6E1D5] shadow-xs text-center flex flex-col items-center justify-center gap-3 my-4">
            <div className="w-12 h-12 rounded-full bg-[#FAF7F0] flex items-center justify-center text-2xl">
              📦
            </div>
            <h4 className="font-extrabold text-sm sm:text-base text-[#2D2620]">
              {selectedFilter === 'all' ? 'No produce currently in stock' : `No ${selectedFilter} currently in stock`}
            </h4>
            <p className="text-xs text-[#666057] max-w-sm">
              All marketplace items reflect live inventory from your local Dark Store micro-hub. Fresh batches arrive directly from regional farm harvests.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => onProductClick && onProductClick(product)}
                className="bg-white rounded-2xl p-3.5 border border-[#E6E1D5] shadow-xs flex md:flex-col items-center md:items-stretch justify-between gap-3 cursor-pointer hover:border-[#354424] hover:shadow-md transition-all"
              >
                {/* Product Thumbnail - Off-white background preserved, inner square box removed */}
                <div className="w-20 md:w-full h-20 md:h-32 bg-[#F8F5EE] rounded-xl p-2 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img 
                    src={product.image || '/images/vegetables_ref.png'} 
                    alt={product.name} 
                    onError={(e) => {
                      e.target.onerror = null;
                      const cat = (product.category || '').toLowerCase();
                      if (cat.includes('fruit')) e.target.src = '/images/fruits_ref.png';
                      else if (cat.includes('veg')) e.target.src = '/images/vegetables_ref.png';
                      else if (cat.includes('grain')) e.target.src = '/images/grains_ref.png';
                      else if (cat.includes('pulse')) e.target.src = '/images/pulses_ref.png';
                      else if (cat.includes('spice')) e.target.src = '/images/spices_ref.png';
                      else if (cat.includes('dry')) e.target.src = '/images/dryfruits_ref.png';
                      else e.target.src = '/images/vegetables_ref.png';
                    }}
                    className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform hover:scale-105" 
                  />
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col gap-0.5">
                  <h4 className="font-extrabold text-xs sm:text-sm text-[#2D2620] leading-tight">
                    {product.name}
                  </h4>
                  <span className="text-[11px] font-semibold text-[#666057]">
                    {product.weight}
                  </span>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-extrabold text-[#2D2620]">
                        ₹ {product.price}
                      </span>
                      <div className="flex items-center gap-0.5 text-[10px] font-bold text-[#666057]">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>{product.rating}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart && onAddToCart(product);
                      }}
                      className="w-8 h-8 rounded-full bg-[#354424] text-white flex items-center justify-center shadow-xs hover:bg-[#2D3B1E] transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
