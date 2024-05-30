"use client";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { useSpring, animated } from "@react-spring/web";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";

export default function QuestionAnswer({
  question,
  answer,
  note,
  className = "",
  startOpen = false,
}: {
  question: string | React.ReactNode;
  answer: string | React.ReactNode;
  note?: string | React.ReactNode;
  className?: string;
  startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);

  const [ref, { height }] = useElementSizeObserver<HTMLDivElement>();

  return (
    <div className={className ?? ""}>
      <div
        className="flex items-center cursor-pointer space-x-[10px]"
        onClick={() => setOpen(!open)}
      >
        <div className="flex w-[13px] h-[13px] items-center justify-center">
          <Icon
            icon="feather:arrow-right-circle"
            className={`w-[13px] h-[13px] transform rotate-0 transition-transform duration-300 ${
              open ? "rotate-90" : "rotate-0"
            }`}
          />
        </div>
        <div className="font-semibold text-sm leading-snug">{question}</div>
      </div>
      <div
        className={`transition-height duration-300 overflow-hidden text-base`}
        style={{
          height: open ? height : 0,
        }}
      >
        <div ref={ref} className="pt-[15px]">
          {answer}
        </div>
      </div>
      <div
        className={`transition-height duration-300 overflow-hidden text-base`}
        style={{
          height: open ? 25 : 0,
        }}
      >
        {note && <div className="pt-[10px]">{note}</div>}
      </div>
    </div>
  );
}
