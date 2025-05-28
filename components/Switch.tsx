"use client";

type SwitchProps = {
  leftLabel?: string;
  rightLabel?: string;
  checked?: boolean;
  onChange?: () => void;
};

export const Switch = ({
  leftLabel,
  rightLabel,
  checked,
  onChange,
}: SwitchProps) => {
  return (
    <div className="flex justify-between">
      <div className="flex items-center">
        <input id="toggle" type="checkbox" className="hidden" />
        <label htmlFor="toggle" className="flex items-center cursor-pointer">
          {leftLabel && (
            <div
              className={`mr-[10px] font-medium ${
                checked ? "opacity-100" : "opacity-60"
              }`}
              onClick={onChange}
            >
              {leftLabel}
            </div>
          )}
          <div className="relative" onClick={onChange}>
            <div
              className={`block 
                        w-[50px] h-7
                        rounded-full transition duration-200 ease-in-out text-forest-900 bg-[#344240]`}
            ></div>
            <div
              className={`dot absolute left-0.5 top-0.5
                        w-6
                        h-6
                        rounded-full transition duration-200 ease-in-out
                         text-forest-500 
                        ${checked ? "transform translate-x-[22px] bg-[#CDD8D3] " : "bg-[#5A6462] "}
                        rounded-full`}
            ></div>
          </div>
          {rightLabel && (
            <div
              className={`ml-[10px] font-medium ${
                checked ? "opacity-100" : "opacity-60"
              }`}
              onClick={onChange}
            >
              {rightLabel}
            </div>
          )}
        </label>
      </div>
    </div>
  );
};
