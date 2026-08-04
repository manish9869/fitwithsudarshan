// src/pages/admin/diet/FoodFilterBar.jsx
// Search + Category + Cuisine + Budget-Friendly filter row for the Add Food
// picker — shared by DietPlanBuilder.jsx and DietTemplateEditor.jsx so a
// coach can narrow a 1000+ item food library down fast (e.g. "just show me
// Beverages" or "just Fruits") instead of scrolling or guessing a search term.
import { Search } from 'lucide-react';
import { FOOD_CATEGORIES } from './dietCategories';
import { FOOD_REGIONS } from './dietRegions';

const selectCls = 'rounded-lg px-3 py-2 text-xs font-semibold text-white bg-white/5 border border-white/10 outline-none';

export default function FoodFilterBar({ search, onSearch, category, onCategory, cuisine, onCuisine, budgetOnly, onBudgetOnly }) {
    return (
        <div className="space-y-2.5 mb-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input value={search} onChange={(e) => onSearch(e.target.value)} autoFocus
                    placeholder="Search foods…" className="w-full rounded-lg pl-9 pr-4 py-2.5 text-sm text-white bg-white/5 border border-white/10" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                <select value={category} onChange={(e) => onCategory(e.target.value)} className={selectCls} style={{ background: '#0e0e16' }}>
                    <option value="All">All Categories</option>
                    {FOOD_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={cuisine} onChange={(e) => onCuisine(e.target.value)} className={selectCls} style={{ background: '#0e0e16' }}>
                    <option value="Any">Any Cuisine</option>
                    {FOOD_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <button type="button" onClick={() => onBudgetOnly(!budgetOnly)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full text-xs font-bold transition-colors"
                    style={budgetOnly
                        ? { background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.35)', color: '#34d399' }
                        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}>
                    <span className="relative inline-flex items-center w-7 h-4 rounded-full transition-colors flex-shrink-0"
                        style={{ background: budgetOnly ? '#34d399' : 'rgba(255,255,255,0.15)' }}>
                        <span className="absolute w-3 h-3 rounded-full bg-white transition-transform"
                            style={{ transform: budgetOnly ? 'translateX(14px)' : 'translateX(2px)' }} />
                    </span>
                    ₹ Budget-Friendly Only
                </button>
            </div>
        </div>
    );
}
