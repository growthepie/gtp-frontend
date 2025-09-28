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

  const [ref, { height }] = useElementSizeObserver<HTMLDivElement>();

  return (
    <div className={`rounded-[27px] bg-color-bg-default px-[30px] py-[23px] flex flex-col ${className}`}>
      <div
        className={`flex items-center cursor-pointer space-x-[10px] ${questionClassName}`}
        onClick={() => setOpen(!open)}
      >
        <div className={`flex w-[24px] h-[24px] md:w-[24px] md:h-[24px] items-center justify-center  transform rotate-0 transition-transform duration-300 ${open ? "rotate-90" : "rotate-0"
          }`}>
          {/* <Icon
            icon="feather:arrow-right-circle"
            className={`w-[16px] h-[16px] md:w-[24px] md:h-[24px]  transform rotate-0 transition-transform duration-300 ${open ? "rotate-90" : "rotate-0"
              }`}
          /> */}
          <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M12.2942 3C17.2648 3 21.2942 7.02944 21.2942 12C21.2942 16.9706 17.2648 21 12.2942 21C7.32363 21 3.29419 16.9706 3.29419 12C3.29419 7.02944 7.32363 3 12.2942 3ZM23.2942 12C23.2942 5.92487 18.3693 1 12.2942 1C6.21906 1 1.29419 5.92487 1.29419 12C1.29419 18.0751 6.21906 23 12.2942 23C18.3693 23 23.2942 18.0751 23.2942 12Z" className="fill-color-text-primary" />
            <path fillRule="evenodd" clipRule="evenodd" d="M11.5871 7.29289C11.1966 7.68342 11.1966 8.31658 11.5871 8.70711L14.88 12L11.5871 15.2929C11.1966 15.6834 11.1966 16.3166 11.5871 16.7071C11.9776 17.0976 12.6108 17.0976 13.0013 16.7071L17.0013 12.7071C17.3918 12.3166 17.3918 11.6834 17.0013 11.2929L13.0013 7.29289C12.6108 6.90237 11.9776 6.90237 11.5871 7.29289Z" className="fill-color-text-primary" />
            <path fillRule="evenodd" clipRule="evenodd" d="M17.2942 12C17.2942 11.4477 16.8465 11 16.2942 11L8.29419 11C7.7419 11 7.29419 11.4477 7.29419 12C7.29419 12.5523 7.7419 13 8.29419 13L16.2942 13C16.8465 13 17.2942 12.5523 17.2942 12Z" className="fill-color-text-primary" />
          </svg>


        </div>
        <div className={`font-semibold leading-[133%] heading-small-sm md:heading-small-md`}>{question}</div>
      </div>
      <div
        className={`transition-height duration-300 overflow-hidden text-md ${answerClassName}`}
        style={{
          height: open ? height : 0,
        }}
      >
        <div ref={ref} className="pt-[15px]">
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
