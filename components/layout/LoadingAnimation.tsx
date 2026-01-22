"use client";
import { useMemo, useId } from "react";

interface LoadingAnimationProps {
  mode?: "loading" | "celebration";
}

const PIE_PATHS = [
  "M51.5588 54.6538C51.2319 50.0931 52.474 45.9055 55.1389 41.8447C56.9232 39.1452 59.4535 36.2304 62.2452 33.0195C69.4477 24.7249 78.3691 14.4576 80.5533 0.852539C85.3024 11.2813 82.9989 21.4217 77.7423 30.7468C75.3773 34.9383 72.7586 37.9493 70.2591 40.8218C67.3173 44.202 64.5448 47.3898 62.5529 52.0774C61.4569 54.6269 60.834 57.0687 60.5417 59.4567L51.5588 54.6538Z",
  "M66.9719 62.9051C68.0679 58.8828 69.9637 55.1219 72.4824 51.4726C74.5666 48.4271 76.5201 46.1698 78.2736 44.1433C84.1725 37.3177 87.8333 33.08 86.7604 10.2036C87.4488 11.6726 88.1294 13.0877 88.7908 14.4528L88.7947 14.4605C94.5474 26.4044 98.5851 34.7797 91.8018 46.2813C88.4486 51.9649 86.0029 54.7912 83.8418 57.2908C81.4076 60.1018 79.3311 62.5052 76.7201 68.0964L66.9719 62.9051Z",
  "M92.2324 59.3017C89.5868 62.4357 85.2684 66.7579 85.0723 67.0425L109.51 53.3797C108.998 48.8267 105.641 43.4624 101.515 35.8369C102.35 45.8888 98.4274 51.9608 92.2324 59.3017Z",
  "M109.33 57.9219C108.672 60.8367 105.073 66.9009 102.427 70.0503C94.0671 79.9946 89.7141 84.2361 82.5616 99.1986C82.1578 97.5797 81.7348 96.0531 81.331 94.5956C79.3353 87.397 78.1086 81.402 80.5004 76.2338L109.33 57.9219Z",
  "M77.0475 91.6334C75.0018 85.6461 73.5328 80.6394 74.6018 74.306L66.0573 68.7378C65.5843 78.0552 69.5643 88.9339 80.5546 102.939C79.9701 99.4704 78.2165 95.0558 77.0475 91.6334Z",
  "M60.3617 65.0263C60.5079 68.0565 62.3806 76.0665 64.0572 80.3042C59.2735 74.2015 54.0437 64.8379 52.5479 59.9312L60.3617 65.0263Z",
  "M161 110.566C161 96.7029 135.22 85.0436 100.381 81.7788C97.0584 85.5089 93.7359 90.1387 90.5596 96.9644L85.7759 106.051C84.8645 107.728 83.1841 108.827 81.3191 108.974C79.4233 109.12 77.5967 108.289 76.4662 106.77L73.3975 102.648C67.0064 94.4879 62.3304 88.0238 58.6426 81.9749C24.8299 85.4935 0 96.9682 0 110.566C0 126.959 36.0777 140.268 80.5192 140.268C82.665 140.268 84.7953 140.237 86.9026 140.175L93.4245 121.713L93.4783 121.583C94.9165 117.987 98.3773 115.634 102.227 115.58H102.254L159.831 115.734C160.423 114.284 161 112.077 161 110.566Z",
  "M104.602 140.668H149.713L147.74 145.671H102.868L92.8777 174.169V143.906L99.8648 124.137C100.261 123.137 101.23 122.471 102.318 122.456L157 122.471L154.977 127.401H109.328L107.929 131.562H153.416L151.255 136.507H106.183L104.602 140.668Z",
  "M2.76953 123.669C7.96469 138.358 20.6776 155.613 23.381 158.135C32.7177 166.93 62.8004 174.171 86.492 174.171V149.41C45.4229 149.41 13.3598 136.109 2.76953 123.669Z",
];

const FILL_COLOR = "#CDD8D3";

// Smoke paths are indices 0-5 (reversed), pie paths are 6-8 (reversed)
const SMOKE_PATH_COUNT = 6;

export default function LoadingAnimation({
  mode = "loading",
}: LoadingAnimationProps) {
  const scopeId = useId().replace(/:/g, "");

  const reversedPaths = useMemo(() => [...PIE_PATHS].reverse(), []);

  const animationDuration = mode === "celebration" ? "2s" : "1.666s";
  const animationName =
    mode === "celebration"
      ? `FadeInOutCelebration-${scopeId}`
      : `FadeInOut-${scopeId}`;

  return (
    <>
      <style>
        {`
          .smoke-${scopeId} {
            opacity: 0;
            will-change: opacity, transform;
            transform: translateZ(0);
            animation-timing-function: ease-in-out;
            animation-fill-mode: forwards;
            animation-name: ${animationName};
            animation-duration: ${animationDuration};
            animation-iteration-count: infinite;
            transform-origin: center center;
          }

          .smoke-${scopeId}:nth-child(4) { animation-delay: 0.150s; }
          .smoke-${scopeId}:nth-child(5) { animation-delay: 0.300s; }
          .smoke-${scopeId}:nth-child(6) { animation-delay: 0.450s; }
          .smoke-${scopeId}:nth-child(7) { animation-delay: 0.600s; }
          .smoke-${scopeId}:nth-child(8) { animation-delay: 0.750s; }
          .smoke-${scopeId}:nth-child(9) { animation-delay: 0.900s; }

          .pie-${scopeId} {
            opacity: 0;
            will-change: opacity;
            transform: translateZ(0);
            animation-timing-function: ease-in;
            animation-fill-mode: forwards;
            animation-name: FadeIn-${scopeId};
            animation-duration: 0.777s;
            animation-iteration-count: 1;
          }

          .pie-${scopeId}:nth-child(1),
          .pie-${scopeId}:nth-child(2),
          .pie-${scopeId}:nth-child(3) {
            animation-delay: 0.1s;
          }

          @keyframes FadeInOut-${scopeId} {
            0% { opacity: 0; }
            80% { opacity: 1; }
            100% { opacity: 0; }
          }

          @keyframes FadeIn-${scopeId} {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }

          @keyframes FadeInOutCelebration-${scopeId} {
            0% {
              opacity: 0;
              transform: scale(0.8);
            }
            50% {
              opacity: 1;
              transform: scale(1.1);
            }
            100% {
              opacity: 0;
              transform: scale(1);
            }
          }
        `}
      </style>
      <svg
        width="161"
        height="175"
        viewBox="0 0 161 175"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={mode === "celebration" ? "Celebration" : "Loading"}
      >
        {reversedPaths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill={FILL_COLOR}
            className={
              i >= PIE_PATHS.length - SMOKE_PATH_COUNT
                ? `smoke-${scopeId}`
                : `pie-${scopeId}`
            }
          />
        ))}
      </svg>
    </>
  );
}