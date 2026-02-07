export default function GTPButtonContainer({ children, className }: { children: React.ReactNode, className?: string }) {   
    return (
        <div className={`select-none flex  gap-y-[5px] flex-col rounded-[15px] py-[2px] px-[2px] text-xs lg:gap-y-0 lg:text-base lg:flex lg:flex-row w-full justify-between items-center lg:rounded-full bg-color-bg-medium ${className}`}>
            {children}
        </div>
    );
}