import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface RadioOption {
    value: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
}

interface MobileRadioCardProps {
    options: RadioOption[];
    value?: string;
    onValueChange: (value: string) => void;
    className?: string;
}

export function MobileRadioCard({
    options,
    value,
    onValueChange,
    className,
}: MobileRadioCardProps) {
    return (
        <div className={cn("grid gap-3", className)}>
            {options.map((option) => {
                const isSelected = value === option.value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onValueChange(option.value)}
                        className={cn(
                            "relative flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
                            "hover:border-primary/50 hover:bg-primary/5",
                            "active:scale-[0.98]",
                            isSelected
                                ? "border-primary bg-primary/10 shadow-sm"
                                : "border-muted bg-background"
                        )}
                    >
                        {/* Radio indicator */}
                        <div
                            className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                                isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted-foreground/30 bg-background"
                            )}
                        >
                            {isSelected && <Check className="h-4 w-4" />}
                        </div>

                        {/* Icon if provided */}
                        {option.icon && (
                            <div className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                                isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                            )}>
                                {option.icon}
                            </div>
                        )}

                        {/* Label and description */}
                        <div className="flex-1 min-w-0">
                            <div className={cn(
                                "font-medium text-base",
                                isSelected ? "text-primary" : "text-foreground"
                            )}>
                                {option.label}
                            </div>
                            {option.description && (
                                <div className="text-sm text-muted-foreground mt-0.5 truncate">
                                    {option.description}
                                </div>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
