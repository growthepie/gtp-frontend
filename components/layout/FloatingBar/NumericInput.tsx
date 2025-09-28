import React from 'react';
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";

interface NumericInputProps {
  value: number;
  setValue: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
}

export const NumericInput: React.FC<NumericInputProps> = ({
  value,
  setValue,
  min = 1,
  max = 100,
  step = 1,
  unit = '',
  className = '',
}) => {
  const handleIncrement = () => {
    setValue(Math.min(max, value + step));
  };

  const handleDecrement = () => {
    setValue(Math.max(min, value - step));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = parseInt(e.target.value, 10);
    if (isNaN(newValue)) {
      newValue = min;
    }
    setValue(Math.max(min, Math.min(max, newValue)));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
      setValue(min);
    }
  };

  return (
    <div
      className={`relative flex items-center bg-color-bg-default rounded-full h-[34px] px-1 gap-x-0.5 overflow-hidden ${className}`}
    >
      {/* Decrement Button */}
      <button
        onClick={handleDecrement}
        disabled={value <= min}
        className="flex items-center justify-center p-0.5 rounded-full text-color-text-primary bg-transparent hover:bg-color-bg-medium/60"
        aria-label={`Decrease value by ${step}`}
        title="Decrease size"
      >
        <GTPIcon icon={"feather:minus" as GTPIconName} size="sm" />
      </button>
      
      <style>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
      
      {/* Number input */}
      <input 
        type="number" 
        min={min}
        max={max}
        step={step}
        value={value} 
        onChange={handleChange} 
        onBlur={handleBlur} 
        className="w-[30px] h-full bg-transparent border-none text-center focus:outline-none text-white" 
      />

      {/* Unit Display */}
      {unit && (
        <span className="text-[10px] text-color-text-primary/80 select-none pointer-events-none -ml-0.5 pr-1">
          {unit}
        </span>
      )}

      {/* Increment Button */}
      <button
        onClick={handleIncrement}
        disabled={value >= max}
        className="flex items-center justify-center p-0.5 rounded-full text-color-text-primary bg-transparent hover:bg-color-bg-medium/60 -ml-0.5"
        aria-label={`Increase value by ${step}`}
        title="Increase size"
      >
        <GTPIcon icon={"feather:plus" as GTPIconName} size="sm" />
      </button>
    </div>
  );
};