
export default function GTPButtonRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center border-[0.5px] rounded-full border-color-bg-default">
      {children}
    </div>
  );
}