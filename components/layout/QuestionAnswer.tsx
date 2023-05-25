import { Icon } from "@iconify/react";
import { useState } from "react";
import { useSpring, animated } from "@react-spring/web";

export default function QuestionAnswer({
  question,
  answer,
  className = "",
}: {
  question: string | React.ReactNode;
  answer: string | React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={className ?? ""}>
      <div
        className="flex items-center cursor-pointer space-x-[10px]"
        onClick={() => setOpen(!open)}
      >
        <div>
          {open ? (
            <Icon
              icon="feather:arrow-down-circle"
              className="w-[13px] h-[13px] block"
            />
          ) : (
            <Icon
              icon="feather:arrow-right-circle"
              className="w-[13px] h-[13px] block"
            />
          )}
        </div>
        <div className="font-semibold text-sm leading-snug">{question}</div>
      </div>
      <div
        className={`transition-height duration-300 ease-in-out overflow-hidden text-base ${
          open ? "h-auto mt-[15px]" : "h-0 mt-0"
        }`}
      >
        {answer}
      </div>
    </div>
  );
}
