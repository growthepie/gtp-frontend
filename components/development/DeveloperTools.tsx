import ApiTool, { GlobalSearchToggleButton } from "./ApiTool";
import NotificationTool from "./NotificationTool";

export default function DeveloperTools() {

  if (process.env.NEXT_PUBLIC_VERCEL_ENV === "production")
    return null;

  return (
    <div className="fixed bottom-0 left-0 bg-white dark:bg-black text-[0.6rem] leading-snug font-mono px-1 py-0.5 z-[9999] select-none">
      <div className="flex gap-x-2">
        <div>
          <div className="block sm:hidden">{"< sm"}</div>
          <div className="hidden sm:block md:hidden">{"sm"}</div>
          <div className="hidden md:block lg:hidden">{"md"}</div>
          <div className="hidden lg:block xl:hidden">{"lg"}</div>
          <div className="hidden xl:block 2xl:hidden">{"xl"}</div>
          <div className="hidden 2xl:block">{"2xl"}</div>
        </div>
        <ApiTool />
        <NotificationTool />
        {/* <GlobalSearchToggleButton /> */}
      </div>
    </div>
  )
}

