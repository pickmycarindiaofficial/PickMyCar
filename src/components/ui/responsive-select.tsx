import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
    DrawerHeader,
    DrawerTitle,
    DrawerFooter,
    DrawerClose,
} from "@/components/ui/drawer";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { FormControl } from "@/components/ui/form";

interface Option {
    value: string | number;
    label: string;
    [key: string]: any; // Allow extra props for custom rendering if needed
}

interface ResponsiveSelectProps {
    options: Option[];
    value?: string | number;
    onValueChange: (value: any) => void;
    placeholder?: string;
    title?: string;
    className?: string;
    disabled?: boolean;
    withFormControl?: boolean;
}

export function ResponsiveSelect({
    options,
    value,
    onValueChange,
    placeholder = "Select...",
    title = "Select Option",
    className,
    disabled = false,
    withFormControl = true,
}: ResponsiveSelectProps) {
    const isMobile = useIsMobile();
    const [open, setOpen] = React.useState(false);

    // Find selected label safely handling potential type mismatches
    const selectedOption = options.find((opt) => String(opt.value) === String(value));
    const selectedLabel = selectedOption ? selectedOption.label : placeholder;

    const TriggerWrapper = ({ children }: { children: React.ReactNode }) => {
        if (withFormControl) {
            return <FormControl>{children}</FormControl>;
        }
        return <>{children}</>;
    };

    if (isMobile) {
        return (
            <Drawer open={open} onOpenChange={setOpen}>
                <TriggerWrapper>
                    <DrawerTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className={cn("w-full justify-between font-normal", !value && "text-muted-foreground", className)}
                            disabled={disabled}
                        >
                            {selectedOption ? selectedOption.label : placeholder}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </DrawerTrigger>
                </TriggerWrapper>
                <DrawerContent className="max-h-[85vh]">
                    <DrawerHeader>
                        <DrawerTitle>{title}</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4 pt-0">
                        <Command className="w-full rounded-lg border shadow-none">
                            <CommandInput placeholder={`Search ${title.toLowerCase()}...`} />
                            <CommandList className="max-h-[300px] overflow-y-auto">
                                <CommandEmpty>No results found.</CommandEmpty>
                                <CommandGroup>
                                    {options.map((option) => (
                                        <CommandItem
                                            key={option.value}
                                            value={option.label}
                                            onSelect={() => {
                                                onValueChange(option.value);
                                                setOpen(false);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    String(value) === String(option.value) ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            {option.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </div>
                    <DrawerFooter className="pt-2">
                        <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </DrawerContent>
            </Drawer>
        );
    }

    return (
        <Select
            value={value ? String(value) : undefined}
            onValueChange={(val) => {
                // Try to preserve original type (number or string) if possible
                const originalOption = options.find((opt) => String(opt.value) === val);
                if (originalOption) {
                    onValueChange(originalOption.value);
                } else {
                    onValueChange(val);
                }
            }}
            disabled={disabled}
        >
            <TriggerWrapper>
                <SelectTrigger className={className}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
            </TriggerWrapper>
            <SelectContent>
                {options.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
