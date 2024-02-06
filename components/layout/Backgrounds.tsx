// import { isMobile } from "react-device-detect";

type BackgroundsProps = {
  isMobileMenu?: boolean;
};

export default function Backgrounds({ isMobileMenu }: BackgroundsProps) {
  if (isMobileMenu)
    return (
      <>
        <div
          style={{
            pointerEvents: "none",
            // background: `radial-gradient(90.11% 90.11% at 77.71% 27.89%, #1B2524 0%, #364240 100%) fixed`,
          }}
          className="fixed inset-0 z-20 mouse-events-none overflow-hidden w-full h-full bg-white dark:bg-[#1F2726]"
        ></div>
        <div
          style={{
            mixBlendMode: "screen",
            opacity: 0.065,
            pointerEvents: "none",
          }}
          className="fixed inset-0 z-20 mouse-events-none overflow-hidden w-full h-full  hidden md:dark:block antialiased"
        >
          <div
            style={{
              height: "600px",
              width: "500px",
              left: "100px",
              right: "-6px",
              top: "0px",
              bottom: "602px",
              backgroundImage: `-webkit-radial-gradient(45% 45% at 50% 50%, #FBB90D 0%, rgba(217, 217, 217, 0) 100%, rgba(251, 185, 13, 0) 100%)`,
              background: `radial-gradient(45% 45% at 50% 50%, #FBB90D 0%, rgba(217, 217, 217, 0) 100%, rgba(251, 185, 13, 0) 100%)`,
              WebkitMaskImage: `-webkit-radial-gradient(45% 45% at 50% 50%, #FBB90D 0%, rgba(217, 217, 217, 0) 100%, rgba(251, 185, 13, 0) 100%)`,
              maskImage: `radial-gradient(45% 45% at 50% 50%, #FBB90D 0%, rgba(217, 217, 217, 0) 100%, rgba(251, 185, 13, 0) 100%)`,
            }}
            className="absolute z-0 mouse-events-none"
          ></div>
          <div
            style={{
              height: "600px",
              width: "700px",
              left: "275px",
              right: "-475px",
              top: "0px",
              bottom: "466px",
              backgroundImage: `-webkit-radial-gradient(45% 45% at 50% 50%, #0DF6B9 0%, rgba(217, 217, 217, 0) 100%, rgba(13, 246, 185, 0) 100%)`,
              background: `radial-gradient(45% 45% at 50% 50%, #0DF6B9 0%, rgba(217, 217, 217, 0) 100%, rgba(13, 246, 185, 0) 100%)`,
              WebkitMaskImage: `-webkit-radial-gradient(45% 45% at 50% 50%, #0DF6B9 0%, rgba(217, 217, 217, 0) 100%, rgba(13, 246, 185, 0) 100%)`,
              maskImage: `radial-gradient(45% 45% at 50% 50%, #0DF6B9 0%, rgba(217, 217, 217, 0) 100%, rgba(13, 246, 185, 0) 100%)`,
            }}
            className="absolute z-0 mouse-events-none"
          ></div>
        </div>
      </>
    );

  return (
    <div className="absolute min-w-full min-h-full -z-10">
      <div
        style={{
          pointerEvents: "none",
          // background: `radial-gradient(90.11% 90.11% at 77.71% 27.89%, #1B2524 0%, #364240 100%) fixed`,
        }}
        className="absolute z-0 mouse-events-none overflow-hidden w-full h-full hidden dark:block dark:bg-forest-1000"
      ></div>
      {/* {!isMobile && ( */}
      <div
        style={{
          mixBlendMode: "overlay",
          opacity: 0.3,
          pointerEvents: "none",
        }}
        className="absolute z-0 mouse-events-none overflow-hidden w-full h-full hidden md:dark:block"
      >
        <div
          style={{
            height: "1215px",
            width: "1026px",
            left: "0px",
            right: "-6px",
            top: "-90px",
            bottom: "602px",
            backgroundImage: `-webkit-radial-gradient(45% 45% at 30% 50%, #FBB90D 0%, rgba(217, 217, 217, 0) 100%, rgba(251, 185, 13, 0) 100%)`,
            background: `radial-gradient(45% 45% at 30% 50%, #FBB90D 0%, rgba(217, 217, 217, 0) 100%, rgba(251, 185, 13, 0) 100%)`,
            WebkitMaskImage: `-webkit-radial-gradient(45% 45% at 20% 50%, #FBB90D 0%, rgba(217, 217, 217, 0.1) 100%, rgba(251, 185, 13, 0) 100%)`,
            maskImage: `radial-gradient(45% 45% at 20% 50%, #FBB90D 0%, rgba(217, 217, 217, 0.1) 100%, rgba(251, 185, 13, 0) 100%)`,
          }}
          className="absolute z-0 mouse-events-none"
        ></div>
        <div
          style={{
            height: "1274px",
            width: "1405px",
            left: "410px",
            right: "-475px",
            top: "-90px",
            bottom: "466px",
            backgroundImage: `-webkit-radial-gradient(45% 45% at 50% 50%, #0DF6B9 0%, rgba(217, 217, 217, 0) 100%, rgba(13, 246, 185, 0) 100%)`,
            background: `radial-gradient(45% 45% at 50% 50%, #0DF6B9 0%, rgba(217, 217, 217, 0) 100%, rgba(13, 246, 185, 0) 100%)`,
            WebkitMaskImage: `-webkit-radial-gradient(45% 45% at 50% 50%, #0DF6B9 0%, rgba(217, 217, 217, 0) 100%, rgba(13, 246, 185, 0) 100%)`,
            maskImage: `radial-gradient(45% 45% at 50% 50%, #0DF6B9 0%, rgba(217, 217, 217, 0) 100%, rgba(13, 246, 185, 0) 100%)`,
          }}
          className="absolute z-0 mouse-events-none"
        ></div>
      </div>
      {/* )} */}
    </div>
  );
}
