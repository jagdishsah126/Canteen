import React from 'react';
import { Coffee } from 'lucide-react';
import { BreakfastPreset, BreakfastRecord } from '../types/canteen';
import { MultiChoiceMealSelector } from './MultiChoiceMealSelector';

interface BreakfastSelectorProps {
  breakfast: BreakfastRecord;
  presets: BreakfastPreset[];
  onToggleEaten: () => void;
  onSelectPreset: (preset: BreakfastPreset) => void;
  onSetCustom: (item: string, price: number) => void;
}

export const BreakfastSelector: React.FC<BreakfastSelectorProps> = ({
  breakfast,
  presets,
  onToggleEaten,
  onSelectPreset,
  onSetCustom,
}) => {
  return (
    <MultiChoiceMealSelector
      label="Breakfast"
      icon={<Coffee className="w-5 h-5" />}
      eaten={breakfast.eaten}
      selectedItem={breakfast.item}
      price={breakfast.price}
      presets={presets}
      onToggleEaten={onToggleEaten}
      onSelectPreset={(p) => onSelectPreset(p as BreakfastPreset)}
      onSetCustom={onSetCustom}
    />
  );
};
