import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sparkles, Grid } from 'lucide-react';

interface HomepageToggleProps {
  useRecommended: boolean;
  onToggle: (value: boolean) => void;
}

export const HomepageToggle = ({ useRecommended, onToggle }: HomepageToggleProps) => {
  return (
    <div className="flex items-center gap-2 md:gap-3 bg-card border rounded-lg p-2 md:p-3 min-w-fit">
      <Grid className={`w-3 h-3 md:w-4 md:h-4 flex-shrink-0 ${!useRecommended ? 'text-primary' : 'text-muted-foreground'}`} />
      <Label htmlFor="homepage-mode" className="text-xs md:text-sm cursor-pointer whitespace-nowrap">
        {useRecommended ? 'Smart' : 'Classic'}
      </Label>
      <Switch
        id="homepage-mode"
        checked={useRecommended}
        onCheckedChange={onToggle}
      />
      <Sparkles className={`w-3 h-3 md:w-4 md:h-4 flex-shrink-0 ${useRecommended ? 'text-primary' : 'text-muted-foreground'}`} />
    </div>
  );
};
