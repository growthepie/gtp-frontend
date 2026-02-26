"use client"
import Image from "next/image";
import Link from "next/link";
import Sidebar from "./Sidebar";
import Icon from "./Icon";
import EthUsdSwitch from "./EthUsdSwitch";
import { useMediaQuery } from "usehooks-ts";
import { useLocalStorage } from 'usehooks-ts';
import Banner from "@/components/Banner";
import SupportUsBanner from "./SupportUsBanner";
import Notification from "@/components/Notification";
import HeaderLinks from "./HeaderLinks";
import { track } from "@/lib/tracking";
import FocusSwitch from "./FocusSwitch";
import { HeaderSearchButton, SearchComponent } from "../search/Components";
import { IS_DEVELOPMENT, IS_PRODUCTION } from "@/lib/helpers";
import { LogoContextMenu } from "./SidebarContainer";
import { ProjectsMetadataProvider } from "@/app/(layout)/applications/_contexts/ProjectsMetadataContext";
import { useIsStaleSession } from "@/hooks/useIsStaleSession";

export default function Header() {
  // const [isOpen, setIsOpen] = useState<boolean>(false)
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isStale = useIsStaleSession();
  // const [showGlobalSearchBar, setShowGlobalSearchBar] = useLocalStorage("showGlobalSearchBar", true);
  const showGlobalSearchBar = true;

  return (
    <>
      <header className="flex justify-between space-x-0 xl:space-x-6 items-start max-w-[1600px] w-full mx-auto px-[20px] pt-[20px] md:px-[50px] md:pt-[52px] mb-[10px]">
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-x-0 xl:gap-x-6 w-full">
            <div className="flex h-[37px] justify-between items-start md:hidden relative w-full self-stretch pl-[5px] pr-[5px]">
              <LogoContextMenu>
                <Link href="/" prefetch={isStale ? false : undefined} className="">
                  <div className="h-[36px] w-[154.05px] relative ">
                    <svg width="155" height="36" viewBox="0 0 155 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.7093 11.175C10.6414 10.2278 10.8994 9.35794 11.4529 8.51448C11.8235 7.95377 12.3491 7.34833 12.929 6.68139C14.425 4.95852 16.278 2.82591 16.7317 0C17.7181 2.16616 17.2397 4.27241 16.1478 6.20934C15.6566 7.07995 15.1127 7.70536 14.5935 8.30201C13.9825 9.0041 13.4066 9.66625 12.9929 10.6399C12.7652 11.1695 12.6358 11.6767 12.5751 12.1727L10.7093 11.175Z" fill="url(#paint0_radial_22630_130036)" />
                      <path d="M13.9106 12.889C14.1383 12.0535 14.532 11.2724 15.0552 10.5144C15.4881 9.88177 15.8939 9.41292 16.2581 8.99199C17.4833 7.57424 18.2437 6.69404 18.0209 1.94238C18.1639 2.2475 18.3052 2.54143 18.4426 2.82498L18.4434 2.82658C19.6383 5.30744 20.477 7.04707 19.068 9.43608C18.3715 10.6166 17.8635 11.2037 17.4146 11.7228C16.9091 12.3067 16.4777 12.8059 15.9354 13.9673L13.9106 12.889Z" fill="url(#paint1_radial_22630_130036)" />
                      <path d="M19.1575 12.1405C18.608 12.7914 17.711 13.6892 17.6703 13.7483L22.7462 10.9104C22.64 9.96472 21.9427 8.85049 21.0857 7.2666C21.259 9.35449 20.4443 10.6157 19.1575 12.1405Z" fill="url(#paint2_radial_22630_130036)" />
                      <path d="M22.7088 11.8545C22.5722 12.4599 21.8246 13.7195 21.2751 14.3737C19.5386 16.4392 18.6344 17.3202 17.1488 20.4281C17.0649 20.0918 16.9771 19.7747 16.8932 19.472C16.4787 17.9768 16.2239 16.7315 16.7207 15.6581L22.7088 11.8545Z" fill="url(#paint3_radial_22630_130036)" />
                      <path d="M16.0035 18.8553C15.5786 17.6116 15.2735 16.5717 15.4955 15.2562L13.7207 14.0996C13.6225 16.0349 14.4492 18.2945 16.7319 21.2035C16.6105 20.4831 16.2463 19.5661 16.0035 18.8553Z" fill="url(#paint4_radial_22630_130036)" />
                      <path d="M12.5378 13.3288C12.5681 13.9582 12.9571 15.622 13.3053 16.5022C12.3117 15.2346 11.2254 13.2897 10.9147 12.2705L12.5378 13.3288Z" fill="url(#paint5_radial_22630_130036)" />
                      <path d="M33.4413 22.7879C33.4413 19.9085 28.0866 17.4867 20.8501 16.8086C20.16 17.5834 19.4699 18.545 18.8101 19.9628L17.8165 21.8502C17.6272 22.1984 17.2782 22.4269 16.8908 22.4572C16.497 22.4876 16.1176 22.315 15.8828 21.9995L15.2454 21.1433C13.9179 19.4484 12.9466 18.1057 12.1807 16.8493C5.15741 17.5802 0 19.9636 0 22.7879C0 26.1929 7.4937 28.9573 16.7246 28.9573C17.1703 28.9573 17.6128 28.9509 18.0505 28.9381L19.4052 25.1034L19.4164 25.0763C19.7151 24.3294 20.4339 23.8406 21.2335 23.8294H21.2391L33.1985 23.8614C33.3215 23.5603 33.4413 23.1018 33.4413 22.7879Z" fill="url(#paint6_radial_22630_130036)" />
                      <path d="M21.7271 29.0406H31.097L30.6872 30.0798H21.3669L19.2917 35.9992V29.7131L20.743 25.6069C20.8253 25.3992 21.0266 25.261 21.2526 25.2578L32.6106 25.261L32.1905 26.285H22.7087L22.418 27.1492H31.8662L31.4173 28.1764H22.0554L21.7271 29.0406Z" fill="url(#paint7_radial_22630_130036)" />
                      <path d="M0.575317 25.5098C1.6544 28.5609 4.29501 32.1448 4.85652 32.6688C6.79584 34.4955 13.0443 35.9995 17.9653 35.9995V30.8565C9.43485 30.8565 2.77502 28.0937 0.575317 25.5098Z" fill="url(#paint8_radial_22630_130036)" />
                      <path d="M141 21.4596C141 18.2239 138.747 15.8789 135.509 15.8789C132.23 15.8789 129.93 18.2644 129.93 21.5639C129.93 25.1313 132.266 27.1228 136.405 27.1228C137.76 27.1274 139.095 26.7999 140.298 26.1683L139.765 24.0522C138.68 24.5925 137.476 24.9213 136.425 24.9213C134.279 24.9213 132.983 23.987 132.84 22.3909H140.933C140.959 22.165 141 21.7913 141 21.4596ZM132.784 20.6297C132.927 19.1566 133.971 18.0993 135.488 18.0993C137.004 18.0993 138.05 19.1566 138.193 20.6297H132.784Z" fill="rgb(var(--text-primary))" />
                      <path d="M128.705 12H125.96V14.7592H128.705V12Z" fill="rgb(var(--text-primary))" />
                      <path d="M128.705 16.0654H125.96V26.9357H128.705V16.0654Z" fill="rgb(var(--text-primary))" />
                      <path d="M119.711 15.8789C118.092 15.8789 116.822 16.6683 116.002 17.9327V16.0657H113.606V30.9408H116.351V25.4369C117.066 26.5246 118.345 27.146 119.834 27.146C122.56 27.146 124.731 24.759 124.731 21.4813C124.731 18.2036 122.621 15.8789 119.711 15.8789ZM119.139 24.7793C117.52 24.7793 116.332 23.4309 116.332 21.5841C116.332 19.6549 117.52 18.2441 119.139 18.2441C120.759 18.2441 121.926 19.6549 121.926 21.5841C121.924 23.4309 120.756 24.7793 119.138 24.7793H119.139Z" fill="rgb(var(--text-primary))" />
                      <path d="M107.415 15.8789C104.138 15.8789 101.843 18.2644 101.843 21.5639C101.843 25.1313 104.178 27.1228 108.318 27.1228C109.673 27.1272 111.008 26.7998 112.211 26.1683L111.673 24.0522C110.587 24.5925 109.384 24.9213 108.334 24.9213C106.188 24.9213 104.892 23.987 104.747 22.3909H112.846C112.866 22.1621 112.907 21.7884 112.907 21.4567C112.907 18.2282 110.653 15.8789 107.415 15.8789ZM104.69 20.6297C104.833 19.1566 105.879 18.0993 107.395 18.0993C108.912 18.0993 109.956 19.1566 110.099 20.6297H104.69Z" fill="rgb(var(--text-primary))" />
                      <path d="M97.9277 15.8788C97.1503 15.867 96.3838 16.065 95.7069 16.4524C95.0301 16.8399 94.6104 17.4028 94.2196 18.0833V12H91.4728V26.9359H94.2196V21.9939C94.2196 19.8561 95.2038 18.3208 96.7618 18.3208C97.8876 18.3208 98.5643 19.1507 98.5643 20.8309V26.9301H101.31V20.153C101.308 17.7936 100.55 15.8788 97.9277 15.8788Z" fill="rgb(var(--text-primary))" />
                      <path d="M89.1767 24.5726C88.6044 24.5726 88.1524 24.2612 88.1524 23.5138V18.2025H90.4056V16.0661H88.1524V13.1592H85.4071V16.0661H81.5144L79.5602 24.6479L77.9293 17.2147H75.6404L74.0095 24.658L72.0353 16.0734H69.2413L72.0682 26.9436H75.3056L76.7648 20.7155L78.2569 26.9436H81.3713L83.6603 18.2097H85.4085V24.0323C85.4085 26.1687 86.4729 27.1232 88.3999 27.1232C89.3903 27.1282 90.3647 26.8711 91.2267 26.3773L90.6716 24.1771C90.344 24.3234 89.7503 24.5726 89.1767 24.5726Z" fill="rgb(var(--text-primary))" />
                      <path d="M64.1184 15.8789C60.8395 15.8789 58.4833 18.2441 58.4833 21.5277C58.4833 24.8112 60.8395 27.1503 64.1184 27.1503C67.3759 27.1503 69.732 24.7851 69.732 21.5277C69.732 18.2702 67.3759 15.8789 64.1184 15.8789ZM64.1184 24.7793C62.499 24.7793 61.3101 23.4091 61.3101 21.5219C61.3101 19.6346 62.499 18.2441 64.1184 18.2441C65.7378 18.2441 66.9252 19.6129 66.9252 21.5016C66.9252 23.3903 65.7364 24.7793 64.1184 24.7793Z" fill="rgb(var(--text-primary))" />
                      <path d="M54.9168 18.389V16.0715H52.3975V26.9418H55.1428V20.3602C55.7151 19.1363 57.1299 18.4773 58.3803 18.4773V15.9412L58.2372 15.9209C56.9254 15.9209 55.675 16.8957 54.9168 18.389Z" fill="rgb(var(--text-primary))" />
                      <path d="M48.7495 17.9747C47.9298 16.7088 46.6594 15.8789 45.0071 15.8789C42.0901 15.8789 40 18.2441 40 21.5016C40 24.4882 42.1101 26.7911 45.04 26.7911C45.6892 26.7992 46.3313 26.6532 46.9148 26.365C47.4983 26.0768 48.0071 25.6543 48.4005 25.1313V26.2103C48.4005 28.2642 47.2331 29.3635 45.1845 29.3635C43.6881 29.3635 42.5822 29.0521 41.2704 28.3887L40.4707 30.4426C41.9374 31.181 43.5536 31.5642 45.1916 31.5622C49.0027 31.5622 51.1543 29.6329 51.1543 26.2103V16.0715H48.7495V17.9747ZM45.6137 24.5722C43.9957 24.5722 42.8068 23.2237 42.8068 21.5841C42.8068 19.6549 43.9957 18.2441 45.6137 18.2441C47.2317 18.2441 48.4005 19.6549 48.4005 21.5841C48.4005 23.2237 47.2331 24.5722 45.6137 24.5722Z" fill="rgb(var(--text-primary))" />
                      <defs>
                        <radialGradient id="paint0_radial_22630_130036" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(16.0338 3.78105) rotate(117.912) scale(10.3914 8.02007)">
                          <stop stopColor="#1DF7EF" />
                          <stop offset="1" stopColor="#10808C" />
                        </radialGradient>
                        <radialGradient id="paint1_radial_22630_130036" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(18.697 5.67753) rotate(115.692) scale(10.0663 7.33746)">
                          <stop stopColor="#1DF7EF" />
                          <stop offset="1" stopColor="#10808C" />
                        </radialGradient>
                        <radialGradient id="paint2_radial_22630_130036" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(21.7923 9.27993) rotate(127.548) scale(6.16705 5.55962)">
                          <stop stopColor="#1DF7EF" />
                          <stop offset="1" stopColor="#10808C" />
                        </radialGradient>
                        <radialGradient id="paint3_radial_22630_130036" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(21.5321 14.5176) rotate(125.634) scale(7.95758 7.03036)">
                          <stop stopColor="#1DF7EF" />
                          <stop offset="1" stopColor="#10808C" />
                        </radialGradient>
                        <radialGradient id="paint4_radial_22630_130036" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(16.1646 16.3062) rotate(112.642) scale(5.80641 3.84916)">
                          <stop stopColor="#1DF7EF" />
                          <stop offset="1" stopColor="#10808C" />
                        </radialGradient>
                        <radialGradient id="paint5_radial_22630_130036" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(12.8561 13.5849) rotate(119.008) scale(3.6501 2.88824)">
                          <stop stopColor="#1DF7EF" />
                          <stop offset="1" stopColor="#10808C" />
                        </radialGradient>
                        <radialGradient id="paint6_radial_22630_130036" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(27.1569 20.5822) rotate(159.689) scale(26.4022 16.0358)">
                          <stop stopColor="#FFDF27" />
                          <stop offset="0.9999" stopColor="#FE5468" />
                        </radialGradient>
                        <radialGradient id="paint7_radial_22630_130036" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(30.1077 28.5943) rotate(140.592) scale(12.7635 11.6808)">
                          <stop stopColor="#1DF7EF" />
                          <stop offset="0.9999" stopColor="#10808C" />
                        </radialGradient>
                        <radialGradient id="paint8_radial_22630_130036" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(14.6973 28.7681) rotate(148.427) scale(15.1131 12.5785)">
                          <stop stopColor="#1DF7EF" />
                          <stop offset="0.9999" stopColor="#10808C" />
                        </radialGradient>
                      </defs>
                    </svg>

                  </div>
                </Link>
              </LogoContextMenu>
              <div className="relative flex gap-[5px] justify-center items-start h-[37px] pr-[calc(5px+24px)] pt-[8px]">


                {!showGlobalSearchBar && (
                  <>
                    <Notification />
                    <ProjectsMetadataProvider>
                      <HeaderSearchButton />
                    </ProjectsMetadataProvider>
                    <div className="w-auto">
                      <Sidebar isMobile={true} />
                    </div>
                  </>
                  )}
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="items-center z-10 hidden md:flex md:gap-x-[20px]">
            {!showGlobalSearchBar && <HeaderSearchButton />}
            <div className="h-[40px]"></div>
          </div>
        </div>
      </header>
      <ProjectsMetadataProvider>
        <SearchComponent />
      </ProjectsMetadataProvider>
    </>
  );
}
