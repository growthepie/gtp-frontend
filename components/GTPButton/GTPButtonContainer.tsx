export default function GTPButtonContainer({ children, className, style }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) {   
    return (
        <div className={`select-none flex  gap-y-[5px]  rounded-[15px] py-[2px] px-[2px] text-xs lg:gap-y-0 lg:text-base flex-wrap flex-row w-full justify-between items-center lg:rounded-full bg-color-bg-medium ${className}`}
        
        style={style ?? undefined}>
            {children}
        </div>
    );
}