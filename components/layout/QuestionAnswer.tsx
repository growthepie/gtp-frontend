"use client";
import { useEffect, useRef, useState } from "react";
import { GTPIcon } from "./GTPIcon";

export default function QuestionAnswer({
  question,
  answer,
  note,
  className = "",
  questionClassName = "",
  answerClassName = "",
  startOpen = false,
}: {
  question: string | React.ReactNode;
  answer: string | React.ReactNode;
  note?: string | React.ReactNode;
  className?: string;
  questionClassName?: string;
  answerClassName?: string;
  startOpen?: boolean;
}) {
  const [open, setOpen] = useState(startOpen);
  const [answerHeight, setAnswerHeight] = useState(0);
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateAnswerHeight = () => {
      if (answerRef.current) {
        setAnswerHeight(answerRef.current.offsetHeight);
      }
    };
    updateAnswerHeight();
    const resizeObserver = new ResizeObserver(updateAnswerHeight);
    if (answerRef.current) {
      resizeObserver.observe(answerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [answer]);

  useEffect(() => {
    setOpen(startOpen);
  }, [startOpen]);

  return (
    <div className={`rounded-[27px] bg-color-bg-default px-[30px] py-[23px] flex flex-col ${className}`}>
      <div
        className={`flex items-center cursor-pointer space-x-[10px] ${questionClassName}`}
        onClick={() => setOpen(!open)}
      >
        <div className={`flex w-[26px] h-[26px] bg-color-bg-medium rounded-full items-center justify-center  transform rotate-0 transition-transform duration-300 ${open ? "rotate-90" : "rotate-0"
          }`}>
          <GTPIcon
            icon="chevron-right"
            size="sm"
            className="!size-[16px]"
            containerClassName="!size-[16px]"
            
          />
        </div>
        <div className={`font-semibold leading-[133%] heading-small-sm md:heading-small-md ${open ? "" : "select-none"}`}>{question}</div>
      </div>
      <div
        className={`transition-[height] duration-300 overflow-hidden text-md ${answerClassName}`}
        style={{
          height: open ? answerHeight : 0,
        }}
      >
        <div ref={answerRef} className="pt-[15px]">
          {answer}
        </div>
      </div>
      {
        note && (
          <div
            className={`transition-height duration-300 overflow-hidden text-md ${answerClassName}`}
            style={{
              maxHeight: open ? 300 : 0,
            }
            }
          >
            <div className="pt-[10px]">{note}</div>
          </div >
        )
      }
    </div >
  );
}
