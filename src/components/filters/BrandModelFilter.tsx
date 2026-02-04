import { useState, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Brand {
    id: string;
    name: string;
    is_active: boolean;
    is_luxury?: boolean;
    sort_order?: number;
}

interface Model {
    id: string;
    name: string;
    brand_id: string | null;
    is_active: boolean;
    sort_order?: number;
}

interface BrandModelFilterProps {
    brands: Brand[];
    allModels: Model[];
    selectedBrands: string[];
    selectedModels: string[];
    onBrandsChange: (brands: string[]) => void;
    onModelsChange: (models: string[]) => void;
}

export const BrandModelFilter = ({
    brands,
    allModels,
    selectedBrands,
    selectedModels,
    onBrandsChange,
    onModelsChange,
}: BrandModelFilterProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
    const [showAllBrands, setShowAllBrands] = useState(false);

    // Filter brands by search term
    const filteredBrands = useMemo(() => {
        if (!searchTerm) return brands;
        const lowerSearch = searchTerm.toLowerCase();
        return brands.filter(brand =>
            brand.name.toLowerCase().includes(lowerSearch) ||
            allModels.some(m =>
                m.brand_id === brand.id &&
                m.name.toLowerCase().includes(lowerSearch)
            )
        );
    }, [brands, allModels, searchTerm]);

    // Get models for a specific brand
    const getModelsForBrand = (brandId: string) => {
        return allModels.filter(m => m.brand_id === brandId && m.is_active);
    };

    // Toggle brand selection
    const handleBrandToggle = (brandName: string, brandId: string) => {
        if (selectedBrands.includes(brandName)) {
            // Unselecting brand - also remove its models
            onBrandsChange(selectedBrands.filter(b => b !== brandName));
            const brandModels = getModelsForBrand(brandId).map(m => m.name);
            onModelsChange(selectedModels.filter(m => !brandModels.includes(m)));
            // Collapse the brand
            setExpandedBrands(prev => {
                const next = new Set(prev);
                next.delete(brandId);
                return next;
            });
        } else {
            // Selecting brand - expand to show models
            onBrandsChange([...selectedBrands, brandName]);
            setExpandedBrands(prev => new Set([...prev, brandId]));
        }
    };

    // Toggle model selection
    const handleModelToggle = (modelName: string) => {
        if (selectedModels.includes(modelName)) {
            onModelsChange(selectedModels.filter(m => m !== modelName));
        } else {
            onModelsChange([...selectedModels, modelName]);
        }
    };

    // Toggle brand expansion (without selecting)
    const handleExpandToggle = (brandId: string) => {
        setExpandedBrands(prev => {
            const next = new Set(prev);
            if (next.has(brandId)) {
                next.delete(brandId);
            } else {
                next.add(brandId);
            }
            return next;
        });
    };

    // Display limited brands initially
    const INITIAL_DISPLAY_COUNT = 6;
    const displayBrands = showAllBrands
        ? filteredBrands
        : filteredBrands.slice(0, INITIAL_DISPLAY_COUNT);
    const hasMoreBrands = filteredBrands.length > INITIAL_DISPLAY_COUNT;

    // Count selected models per brand for display
    const getSelectedModelCount = (brandId: string) => {
        const brandModels = getModelsForBrand(brandId).map(m => m.name);
        return selectedModels.filter(m => brandModels.includes(m)).length;
    };

    return (
        <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 pl-8 text-sm border-[#2664eb]/30 focus:border-[#2664eb] focus:ring-[#2664eb]/20"
                />
            </div>

            {/* Top Brands Label */}
            {!searchTerm && (
                <p className="text-xs font-medium text-[#2664eb] uppercase tracking-wider">
                    Top Brands
                </p>
            )}

            {/* Brands List with Nested Models */}
            <div className="space-y-0.5 bg-slate-50/50 rounded-lg p-2">
                {displayBrands.map((brand) => {
                    const models = getModelsForBrand(brand.id);
                    const isExpanded = expandedBrands.has(brand.id) || selectedBrands.includes(brand.name);
                    const isSelected = selectedBrands.includes(brand.name);
                    const selectedModelCount = getSelectedModelCount(brand.id);
                    const hasModels = models.length > 0;

                    return (
                        <div
                            key={brand.id}
                            className={cn(
                                "rounded-lg overflow-hidden transition-all duration-200",
                                isSelected && "bg-[#2664eb]/5 ring-1 ring-[#2664eb]/20"
                            )}
                        >
                            {/* Brand Row */}
                            <div
                                className={cn(
                                    "flex items-center gap-2 py-2.5 px-2 rounded-lg transition-all duration-200 cursor-pointer",
                                    isSelected
                                        ? "bg-[#2664eb]/10 hover:bg-[#2664eb]/15"
                                        : "hover:bg-slate-100"
                                )}
                            >
                                <Checkbox
                                    id={`brand-${brand.id}`}
                                    checked={isSelected}
                                    onCheckedChange={() => handleBrandToggle(brand.name, brand.id)}
                                    className={cn(
                                        "border-2 transition-colors",
                                        isSelected
                                            ? "data-[state=checked]:bg-[#2664eb] data-[state=checked]:border-[#2664eb]"
                                            : "border-slate-300 data-[state=checked]:bg-[#2664eb] data-[state=checked]:border-[#2664eb]"
                                    )}
                                />

                                <label
                                    htmlFor={`brand-${brand.id}`}
                                    className={cn(
                                        "flex-1 text-sm font-medium cursor-pointer select-none flex items-center gap-2 transition-colors",
                                        isSelected ? "text-[#2664eb]" : "text-slate-700 hover:text-slate-900"
                                    )}
                                >
                                    {brand.name}
                                    {selectedModelCount > 0 && (
                                        <span className="text-[10px] bg-[#2664eb] text-white px-1.5 py-0.5 rounded-full font-semibold">
                                            {selectedModelCount}
                                        </span>
                                    )}
                                </label>

                                {/* Expand/Collapse Button */}
                                {hasModels && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleExpandToggle(brand.id);
                                        }}
                                        className={cn(
                                            "p-1 rounded-md transition-colors",
                                            isSelected ? "hover:bg-[#2664eb]/20" : "hover:bg-slate-200"
                                        )}
                                    >
                                        <ChevronDown
                                            className={cn(
                                                "h-4 w-4 transition-transform duration-200",
                                                isSelected ? "text-[#2664eb]" : "text-slate-400",
                                                isExpanded && "rotate-180"
                                            )}
                                        />
                                    </button>
                                )}
                            </div>

                            {/* Models (Nested under brand) */}
                            {hasModels && isExpanded && (
                                <div className="ml-5 pl-3 pb-2 border-l-2 border-[#2664eb]/40 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                                    {models.map((model) => {
                                        const isModelSelected = selectedModels.includes(model.name);
                                        return (
                                            <div
                                                key={model.id}
                                                className={cn(
                                                    "flex items-center gap-2 py-1.5 px-2 rounded-md transition-all",
                                                    isModelSelected
                                                        ? "bg-[#2664eb]/10"
                                                        : "hover:bg-slate-100/80"
                                                )}
                                            >
                                                <Checkbox
                                                    id={`model-${model.id}`}
                                                    checked={isModelSelected}
                                                    onCheckedChange={() => handleModelToggle(model.name)}
                                                    className={cn(
                                                        "h-3.5 w-3.5 border-2",
                                                        isModelSelected
                                                            ? "data-[state=checked]:bg-[#2664eb] data-[state=checked]:border-[#2664eb]"
                                                            : "border-slate-300"
                                                    )}
                                                />
                                                <label
                                                    htmlFor={`model-${model.id}`}
                                                    className={cn(
                                                        "text-sm cursor-pointer select-none transition-colors",
                                                        isModelSelected
                                                            ? "text-[#2664eb] font-medium"
                                                            : "text-slate-600 hover:text-slate-800"
                                                    )}
                                                >
                                                    {model.name}
                                                </label>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Show More/Less Button */}
            {hasMoreBrands && !searchTerm && (
                <button
                    onClick={() => setShowAllBrands(!showAllBrands)}
                    className="text-xs text-[#2664eb] hover:text-[#1a4fc9] hover:underline font-semibold flex items-center gap-1 transition-colors"
                >
                    {showAllBrands
                        ? 'Show Less'
                        : `Show More (${filteredBrands.length - INITIAL_DISPLAY_COUNT})`
                    }
                </button>
            )}

            {/* No results message */}
            {filteredBrands.length === 0 && searchTerm && (
                <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg">
                    No brands found for "{searchTerm}"
                </p>
            )}
        </div>
    );
};
