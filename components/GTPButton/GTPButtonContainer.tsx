export default function GTPButtonContainer({ children, className }: { children: React.ReactNode, className?: string }) {   
    return (
        <div className={`flex items-center rounded-full bg-color-bg-medium px-[2px] py-[2px] justify-between ${className}`}>
            {children}
        </div>
    );
}