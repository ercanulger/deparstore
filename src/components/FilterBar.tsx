import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ArrowUpDown,
  Search,
  X,
  Sparkles,
  Check,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { Category, FilterState, SortOption } from '../types';

interface FilterBarProps {
  categories: Category[];
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  totalProductsCount: number;
  filteredProductsCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  categories,
  filters,
  onFilterChange,
  onResetFilters,
  totalProductsCount,
  filteredProductsCount,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasActiveFilters =
    filters.category !== 'all' ||
    filters.search !== '' ||
    filters.minPrice > 0 ||
    filters.maxPrice < 200000 ||
    filters.inStockOnly ||
    filters.onSaleOnly ||
    filters.sortBy !== 'default';

  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs mb-6 space-y-4">
      
      {/* Category Pills & Top Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const active = filters.category === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => onFilterChange({ category: cat.slug })}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? 'bg-[#121212] text-white shadow-xs font-bold'
                    : 'bg-zinc-100/80 hover:bg-zinc-200/80 text-zinc-700'
                }`}
              >
                <span>{cat.name}</span>
                {cat.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                      active ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-600'
                    }`}
                  >
                    {cat.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sort & Advanced Filters Toggle */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
          
          {/* Sorting Dropdown */}
          <div className="relative flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as SortOption })}
              className="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 text-xs font-semibold rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer appearance-none shadow-xs"
            >
              <option value="default">Varsayılan Sıralama</option>
              <option value="price-asc">Fiyat: Düşükten Yükseğe</option>
              <option value="price-desc">Fiyat: Yüksekten Düşüğe</option>
              <option value="discount-desc">İndirim Oranına Göre (% Yüksek)</option>
              <option value="rating-desc">En Yüksek Puanlılar</option>
              <option value="newest">En Yeni Eklenenler</option>
            </select>
            <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-2.5 pointer-events-none" />
          </div>

          {/* Advanced Filter Toggle Button */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border cursor-pointer ${
              showAdvanced || hasActiveFilters
                ? 'bg-zinc-100 text-zinc-900 border-zinc-300 font-bold'
                : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtrele</span>
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#121212]"></span>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters Expandable Drawer */}
      {showAdvanced && (
        <div className="pt-4 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-zinc-700 animate-in fade-in duration-200">
          
          {/* Price Range Filter */}
          <div className="space-y-2">
            <label className="font-semibold text-zinc-900 block">Fiyat Aralığı (₺)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                placeholder="Min ₺"
                value={filters.minPrice || ''}
                onChange={(e) => onFilterChange({ minPrice: Number(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
              <span className="text-zinc-400">-</span>
              <input
                type="number"
                min={0}
                placeholder="Max ₺"
                value={filters.maxPrice >= 200000 ? '' : filters.maxPrice}
                onChange={(e) =>
                  onFilterChange({ maxPrice: e.target.value ? Number(e.target.value) : 200000 })
                }
                className="w-full px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
          </div>

          {/* Quick Toggles */}
          <div className="space-y-2">
            <label className="font-semibold text-zinc-900 block">Özel Durumlar</label>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.onSaleOnly}
                  onChange={(e) => onFilterChange({ onSaleOnly: e.target.checked })}
                  className="rounded text-zinc-900 focus:ring-zinc-900 w-4 h-4"
                />
                <span>Sadece İndirimli Ürünler</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.inStockOnly}
                  onChange={(e) => onFilterChange({ inStockOnly: e.target.checked })}
                  className="rounded text-zinc-900 focus:ring-zinc-900 w-4 h-4"
                />
                <span>Sadece Stoktakiler</span>
              </label>
            </div>
          </div>

          {/* Search Info */}
          <div className="space-y-1 sm:col-span-2 lg:col-span-1">
            <label className="font-semibold text-zinc-900 block">Arama Kapsamı</label>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Arama kutusu; ürün adını, detaylı açıklamayı ve tüm <strong>teknik özellikleri</strong> tarar.
            </p>
          </div>

          {/* Reset Action */}
          <div className="flex items-end justify-end">
            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg font-semibold transition cursor-pointer border border-zinc-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Filtreleri Sıfırla</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results Count & Active Tags Summary */}
      <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 border-t border-zinc-100/60">
        <div>
          Toplam <strong className="text-zinc-900 font-bold">{filteredProductsCount}</strong> ürün listeleniyor
          {filteredProductsCount !== totalProductsCount && (
            <span> ({totalProductsCount} ürün arasından)</span>
          )}
        </div>
        {filters.search && (
          <div className="flex items-center gap-1 bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded-md font-medium text-[11px] border border-zinc-200">
            <span>Arama: "{filters.search}"</span>
            <button
              onClick={() => onFilterChange({ search: '' })}
              className="hover:text-zinc-950 font-bold ml-1"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
