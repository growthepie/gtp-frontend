// import { isMobile } from "react-device-detect";

type BackgroundsProps = {
    isMobileMenu?: boolean;
  };

  export default function Backgrounds({ isMobileMenu }: BackgroundsProps) {
    if (isMobileMenu)
      return (
        <>
          <div className="fixed inset-0 !z-[998] pointer-events-none overflow-hidden w-full 
  h-full bg-color-bg-default" />
          <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden w-full     
  h-full hidden md:block antialiased mix-blend-screen opacity-[0.065]">
            <div className="absolute z-0 pointer-events-none bg-glow-yellow w-[500px]       
  h-[600px] left-[100px] top-0" />
            <div className="absolute z-0 pointer-events-none bg-glow-turquoise w-[700px]    
  h-[600px] left-[275px] top-0" />
          </div>
        </>
      );

    return (
      <div className="absolute min-w-full min-h-full -z-10">
        <div className="absolute z-0 pointer-events-none overflow-hidden w-full h-full block
   bg-color-bg-main" />
        {/* No opacity - just mix-blend-overlay like Figma */}
        <div className="absolute z-0 pointer-events-none overflow-hidden w-full h-full      
  hidden md:block mix-blend-overlay">
          <div className="absolute z-0 pointer-events-none bg-glow-yellow w-[1791px]        
  h-[1560px] left-0 -top-[838px]" />
          <div className="absolute z-0 pointer-events-none bg-glow-turquoise w-[2240px]     
  h-[1808px] left-[362px] -top-[950px]" />
        </div>
      </div>
    );
  }

type GrayOverlayProps = {
  onClick: () => void;
  zIndex?: number;
}

export const GrayOverlay = ({ onClick, zIndex = 100 }: GrayOverlayProps) => {
  return (
    <div
        className="fixed inset-0 bg-color-bg-default/90"
        style={{ 
          zIndex: zIndex
        }}
        onClick={onClick}
      />
  )
}
