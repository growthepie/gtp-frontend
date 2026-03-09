
export default function GTPButtonRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center w-full lg:w-auto gap-x-[5px] border-[0.5px] rounded-full border-color-bg-default">
      {children}
    </div>
  );
}