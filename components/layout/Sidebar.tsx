"use client";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowsRightLeftIcon,
  LinkIcon,
} from "@heroicons/react/24/solid";
import { useEffect, useState, ReactNode } from "react";
import { Icon } from "@iconify/react";
import SidebarMenuGroup from "./SidebarMenuGroup";
import { MasterResponse } from "@/types/api/MasterResponse";
import useSWR from "swr";
import { Router } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { useMediaQuery } from "@react-hook/media-query";
import { addCollection } from "@iconify/react";
import GTPIcons from "icons/gtp.json";
import GTPHouse from "icons/svg/GTP-House.svg";
import { MasterURL } from "@/lib/urls";

// import iconset from "icons/gtp.json"
addCollection({
  prefix: "gtp",
  icons: {
    house: {
      body: `
      <path fill-rule="evenodd" clip-rule="evenodd" d="M11.4374 1.11009C11.7684 0.852628 12.2319 0.852628 12.5629 1.11009L20.8129 7.52675C21.0362 7.70042 21.1668 7.96745 21.1668 8.25033V18.3337C21.1668 19.063 20.8771 19.7625 20.3614 20.2782C19.8456 20.7939 19.1462 21.0837 18.4168 21.0837H5.5835C4.85415 21.0837 4.15468 20.7939 3.63895 20.2782C3.12323 19.7625 2.8335 19.063 2.8335 18.3337V8.25033C2.8335 7.96745 2.9641 7.70042 3.18738 7.52675L11.4374 1.11009ZM4.66683 8.69865V18.3337C4.66683 18.5768 4.76341 18.8099 4.93531 18.9818C5.10722 19.1538 5.34038 19.2503 5.5835 19.2503H18.4168C18.6599 19.2503 18.8931 19.1538 19.065 18.9818C19.2369 18.8099 19.3335 18.5768 19.3335 18.3337V8.69865L12.0002 2.99495L4.66683 8.69865Z" fill="url(#paint0_linear_1121_7867)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M8.3335 10.9997C8.3335 10.4934 8.7439 10.083 9.25016 10.083H14.7502C15.2564 10.083 15.6668 10.4934 15.6668 10.9997V20.1663C15.6668 20.6726 15.2564 21.083 14.7502 21.083C14.2439 21.083 13.8335 20.6726 13.8335 20.1663V11.9163H10.1668V20.1663C10.1668 20.6726 9.75642 21.083 9.25016 21.083C8.7439 21.083 8.3335 20.6726 8.3335 20.1663V10.9997Z" fill="url(#paint1_linear_1121_7867)"/>
      <defs>
      <linearGradient id="paint0_linear_1121_7867" x1="12.0002" y1="0.916992" x2="12.0002" y2="21.0837" gradientUnits="userSpaceOnUse">
      <stop stop-color="#10808C"/>
      <stop offset="1" stop-color="#1DF7EF"/>
      </linearGradient>
      <linearGradient id="paint1_linear_1121_7867" x1="12.0002" y1="10.083" x2="12.0002" y2="21.083" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FE5468"/>
      <stop offset="1" stop-color="#FFDF27"/>
      </linearGradient>
      </defs>
      `,
    },
    fundamentals: {
      body: `<path fill-rule="evenodd" clip-rule="evenodd" d="M7 16.5H5C4.72386 16.5 4.5 16.7239 4.5 17V19C4.5 19.2761 4.72386 19.5 5 19.5H7C7.27614 19.5 7.5 19.2761 7.5 19V17C7.5 16.7239 7.27614 16.5 7 16.5ZM5 15C3.89543 15 3 15.8954 3 17V19C3 20.1046 3.89543 21 5 21H7C8.10457 21 9 20.1046 9 19V17C9 15.8954 8.10457 15 7 15H5Z" fill="url(#paint0_linear_1121_7876)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M13 16.5H11C10.7239 16.5 10.5 16.7239 10.5 17V19C10.5 19.2761 10.7239 19.5 11 19.5H13C13.2761 19.5 13.5 19.2761 13.5 19V17C13.5 16.7239 13.2761 16.5 13 16.5ZM11 15C9.89543 15 9 15.8954 9 17V19C9 20.1046 9.89543 21 11 21H13C14.1046 21 15 20.1046 15 19V17C15 15.8954 14.1046 15 13 15H11Z" fill="url(#paint1_linear_1121_7876)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M19 16.5H17C16.7239 16.5 16.5 16.7239 16.5 17V19C16.5 19.2761 16.7239 19.5 17 19.5H19C19.2761 19.5 19.5 19.2761 19.5 19V17C19.5 16.7239 19.2761 16.5 19 16.5ZM17 15C15.8954 15 15 15.8954 15 17V19C15 20.1046 15.8954 21 17 21H19C20.1046 21 21 20.1046 21 19V17C21 15.8954 20.1046 15 19 15H17Z" fill="url(#paint2_linear_1121_7876)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M19 4.5H17C16.7239 4.5 16.5 4.72386 16.5 5V7C16.5 7.27614 16.7239 7.5 17 7.5H19C19.2761 7.5 19.5 7.27614 19.5 7V5C19.5 4.72386 19.2761 4.5 19 4.5ZM17 3C15.8954 3 15 3.89543 15 5V7C15 8.10457 15.8954 9 17 9H19C20.1046 9 21 8.10457 21 7V5C21 3.89543 20.1046 3 19 3H17Z" fill="url(#paint3_linear_1121_7876)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M13 10.5H11C10.7239 10.5 10.5 10.7239 10.5 11V13C10.5 13.2761 10.7239 13.5 11 13.5H13C13.2761 13.5 13.5 13.2761 13.5 13V11C13.5 10.7239 13.2761 10.5 13 10.5ZM11 9C9.89543 9 9 9.89543 9 11V13C9 14.1046 9.89543 15 11 15H13C14.1046 15 15 14.1046 15 13V11C15 9.89543 14.1046 9 13 9H11Z" fill="url(#paint4_linear_1121_7876)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M19 10.5H17C16.7239 10.5 16.5 10.7239 16.5 11V13C16.5 13.2761 16.7239 13.5 17 13.5H19C19.2761 13.5 19.5 13.2761 19.5 13V11C19.5 10.7239 19.2761 10.5 19 10.5ZM17 9C15.8954 9 15 9.89543 15 11V13C15 14.1046 15.8954 15 17 15H19C20.1046 15 21 14.1046 21 13V11C21 9.89543 20.1046 9 19 9H17Z" fill="url(#paint5_linear_1121_7876)"/>
      <defs>
      <linearGradient id="paint0_linear_1121_7876" x1="6" y1="15" x2="6" y2="21" gradientUnits="userSpaceOnUse">
      <stop stop-color="#10808C"/>
      <stop offset="1" stop-color="#1DF7EF"/>
      </linearGradient>
      <linearGradient id="paint1_linear_1121_7876" x1="12" y1="15" x2="12" y2="21" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FE5468"/>
      <stop offset="1" stop-color="#FFDF27"/>
      </linearGradient>
      <linearGradient id="paint2_linear_1121_7876" x1="18" y1="15" x2="18" y2="21" gradientUnits="userSpaceOnUse">
      <stop stop-color="#10808C"/>
      <stop offset="1" stop-color="#1DF7EF"/>
      </linearGradient>
      <linearGradient id="paint3_linear_1121_7876" x1="18" y1="3" x2="18" y2="9" gradientUnits="userSpaceOnUse">
      <stop stop-color="#10808C"/>
      <stop offset="1" stop-color="#1DF7EF"/>
      </linearGradient>
      <linearGradient id="paint4_linear_1121_7876" x1="12" y1="9" x2="12" y2="15" gradientUnits="userSpaceOnUse">
      <stop stop-color="#10808C"/>
      <stop offset="1" stop-color="#1DF7EF"/>
      </linearGradient>
      <linearGradient id="paint5_linear_1121_7876" x1="18" y1="9" x2="18" y2="15" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FE5468"/>
      <stop offset="1" stop-color="#FFDF27"/>
      </linearGradient>
      </defs>`,
    },
    package: {
      body: `<path fill-rule="evenodd" clip-rule="evenodd" d="M7.67957 5.405C7.9017 5.01981 8.39403 4.88762 8.77922 5.10975L16.0252 9.28828C16.4104 9.51041 16.5426 10.0027 16.3205 10.3879C16.0984 10.7731 15.606 10.9053 15.2208 10.6832L7.97483 6.50465C7.58963 6.28253 7.45744 5.7902 7.67957 5.405Z" fill="url(#paint0_linear_1121_7942)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M10.7939 3.54721C11.1607 3.33586 11.5765 3.22461 11.9999 3.22461C12.4232 3.22461 12.8391 3.33587 13.2058 3.54723C13.2064 3.54756 13.207 3.54788 13.2075 3.5482L18.8433 6.76865C19.2101 6.98043 19.5148 7.28495 19.7268 7.65166C19.9387 8.01836 20.0505 8.43436 20.051 8.85792V15.3005C20.0505 15.724 19.9387 16.14 19.7268 16.5067C19.5148 16.8734 19.2101 17.178 18.8433 17.3897L18.8402 17.3915L13.2075 20.6102C13.207 20.6105 13.2066 20.6107 13.2061 20.611C12.8393 20.8225 12.4233 20.9338 11.9999 20.9338C11.5764 20.9338 11.1605 20.8225 10.7937 20.6111C10.7932 20.6108 10.7927 20.6105 10.7922 20.6102L5.15951 17.3915L5.1564 17.3897C4.78958 17.178 4.48491 16.8734 4.27294 16.5067C4.06097 16.14 3.94916 15.724 3.94873 15.3005V8.85792C3.94916 8.43436 4.06097 8.01836 4.27294 7.65166C4.48491 7.28495 4.78959 6.98043 5.1564 6.76865L5.1595 6.76686L10.7939 3.54721ZM11.9999 4.83483C11.8585 4.83483 11.7197 4.87204 11.5973 4.9427L11.5942 4.94449L5.96151 8.16315C5.96109 8.16339 5.96066 8.16364 5.96024 8.16388C5.83854 8.23445 5.73744 8.33567 5.66703 8.45748C5.59643 8.57962 5.55916 8.71816 5.55896 8.85922V15.2992C5.55916 15.4402 5.59643 15.5788 5.66703 15.7009C5.73744 15.8227 5.83854 15.9239 5.96024 15.9945C5.96066 15.9948 5.96109 15.995 5.96151 15.9952L11.5973 19.2157C11.7197 19.2864 11.8585 19.3236 11.9999 19.3236C12.1412 19.3236 12.28 19.2864 12.4024 19.2157L12.4055 19.2139L18.0382 15.9952C18.0386 15.995 18.0391 15.9948 18.0395 15.9945C18.1612 15.9239 18.2623 15.8227 18.3327 15.7009C18.4033 15.5787 18.4406 15.44 18.4408 15.2988V8.85957C18.4406 8.71838 18.4033 8.57972 18.3327 8.45748C18.2623 8.33567 18.1612 8.23445 18.0395 8.16389C18.0391 8.16364 18.0386 8.1634 18.0382 8.16315L12.4024 4.94271C12.28 4.87204 12.1412 4.83483 11.9999 4.83483Z" fill="url(#paint1_linear_1121_7942)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M4.27435 7.6189C4.497 7.23401 4.98951 7.10248 5.3744 7.32513L11.9999 11.1577L18.6254 7.32513C19.0103 7.10248 19.5028 7.23401 19.7254 7.6189C19.9481 8.0038 19.8166 8.49631 19.4317 8.71895L12.403 12.7848C12.1536 12.929 11.8462 12.929 11.5968 12.7848L4.56812 8.71895C4.18323 8.49631 4.0517 8.0038 4.27435 7.6189Z" fill="url(#paint2_linear_1121_7942)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M11.9999 11.2744C12.4446 11.2744 12.805 11.6349 12.805 12.0795V20.1951C12.805 20.6397 12.4446 21.0002 11.9999 21.0002C11.5553 21.0002 11.1948 20.6397 11.1948 20.1951V12.0795C11.1948 11.6349 11.5553 11.2744 11.9999 11.2744Z" fill="url(#paint3_linear_1121_7942)"/>
      <defs>
      <linearGradient id="paint0_linear_1121_7942" x1="12" y1="5.00195" x2="12" y2="10.791" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FE5468"/>
      <stop offset="1" stop-color="#FFDF27"/>
      </linearGradient>
      <linearGradient id="paint1_linear_1121_7942" x1="11.9999" y1="3.22461" x2="11.9999" y2="20.9338" gradientUnits="userSpaceOnUse">
      <stop stop-color="#10808C"/>
      <stop offset="1" stop-color="#1DF7EF"/>
      </linearGradient>
      <linearGradient id="paint2_linear_1121_7942" x1="11.9999" y1="7.2168" x2="11.9999" y2="12.893" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FE5468"/>
      <stop offset="1" stop-color="#FFDF27"/>
      </linearGradient>
      <linearGradient id="paint3_linear_1121_7942" x1="11.9999" y1="11.2744" x2="11.9999" y2="21.0002" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FE5468"/>
      <stop offset="1" stop-color="#FFDF27"/>
      </linearGradient>
      </defs>`,
    },
    link: {
      body: `<path fill-rule="evenodd" clip-rule="evenodd" d="M12.6333 4.51798C13.5574 3.62546 14.7951 3.1316 16.0797 3.14276C17.3644 3.15393 18.5933 3.66922 19.5018 4.57766C20.4102 5.48611 20.9255 6.71501 20.9367 7.99969C20.9478 9.28438 20.454 10.522 19.5615 11.4461L19.5515 11.4563L17.1018 13.906C16.6051 14.4029 16.0073 14.7872 15.349 15.0327C14.6907 15.2783 13.9873 15.3794 13.2865 15.3292C12.5857 15.279 11.9039 15.0787 11.2874 14.7418C10.6708 14.405 10.1339 13.9394 9.71304 13.3768C9.4429 13.0157 9.51667 12.5039 9.87782 12.2338C10.239 11.9636 10.7507 12.0374 11.0209 12.3986C11.3014 12.7736 11.6594 13.084 12.0704 13.3086C12.4815 13.5331 12.936 13.6667 13.4032 13.7001C13.8704 13.7336 14.3393 13.6662 14.7782 13.5025C15.217 13.3388 15.6156 13.0826 15.9467 12.7513L15.9468 12.7512L18.3914 10.3067C18.9834 9.69115 19.3109 8.86811 19.3035 8.01389C19.2961 7.15743 18.9525 6.33816 18.3469 5.73253C17.7413 5.1269 16.922 4.78337 16.0656 4.77593C15.211 4.76851 14.3876 5.0963 13.7719 5.68886L12.3718 7.08089C12.0519 7.39886 11.5349 7.39736 11.2169 7.07752C10.8989 6.75768 10.9004 6.24063 11.2203 5.92266L12.6249 4.52625L12.6333 4.51798Z" fill="url(#paint0_linear_1121_7955)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M8.65134 9.10978C9.30962 8.86422 10.013 8.76311 10.7138 8.8133C11.4146 8.86349 12.0964 9.06381 12.713 9.40067C13.3295 9.73753 13.8665 10.2031 14.2873 10.7657C14.5574 11.1268 14.4837 11.6386 14.1225 11.9087C13.7614 12.1789 13.2496 12.1051 12.9795 11.7439C12.6989 11.3689 12.341 11.0585 11.9299 10.8339C11.5189 10.6094 11.0643 10.4758 10.5971 10.4424C10.1299 10.4089 9.66101 10.4763 9.22216 10.64C8.7833 10.8037 8.38479 11.0599 8.05364 11.3912L5.60899 13.8358C5.01691 14.4514 4.68941 15.2744 4.69683 16.1286C4.70427 16.9851 5.0478 17.8043 5.65343 18.41C6.25906 19.0156 7.07833 19.3591 7.93478 19.3666C8.789 19.374 9.61204 19.0465 10.2276 18.4544L11.6187 17.0633C11.9376 16.7444 12.4547 16.7444 12.7736 17.0633C13.0925 17.3822 13.0925 17.8993 12.7736 18.2182L11.3772 19.6146L11.367 19.6245C10.4429 20.517 9.20528 21.0109 7.92059 20.9997C6.63591 20.9886 5.40701 20.4733 4.49856 19.5648C3.59012 18.6564 3.07483 17.4275 3.06366 16.1428C3.0525 14.8581 3.54636 13.6205 4.43888 12.6964L4.44883 12.6862L6.89857 10.2365C6.89853 10.2365 6.8986 10.2365 6.89857 10.2365C7.39526 9.73965 7.9931 9.35532 8.65134 9.10978Z" fill="url(#paint1_linear_1121_7955)"/>
      <defs>
      <linearGradient id="paint0_linear_1121_7955" x1="15.2436" y1="3.14258" x2="15.2436" y2="15.3417" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FE5468"/>
      <stop offset="1" stop-color="#FFDF27"/>
      </linearGradient>
      <linearGradient id="paint1_linear_1121_7955" x1="8.75676" y1="8.80078" x2="8.75676" y2="20.9999" gradientUnits="userSpaceOnUse">
      <stop stop-color="#10808C"/>
      <stop offset="1" stop-color="#1DF7EF"/>
      </linearGradient>
      </defs>`,
    },
    "book-open": {
      body: `<path fill-rule="evenodd" clip-rule="evenodd" d="M3 4.70783C3 4.25596 3.36631 3.88965 3.81818 3.88965H8.72727C9.81225 3.88965 10.8528 4.32065 11.62 5.08785C12.3872 5.85504 12.8182 6.89558 12.8182 7.98056V19.4351C12.8182 19.887 12.4519 20.2533 12 20.2533C11.5481 20.2533 11.1818 19.887 11.1818 19.4351C11.1818 19.0011 11.0094 18.5849 10.7025 18.278C10.3957 17.9711 9.97945 17.7987 9.54545 17.7987H3.81818C3.36631 17.7987 3 17.4324 3 16.9806V4.70783ZM11.1818 16.6008V7.98056C11.1818 7.32957 10.9232 6.70525 10.4629 6.24493C10.0026 5.78462 9.37826 5.52601 8.72727 5.52601H4.63636V16.1624H9.54545C10.1249 16.1624 10.6885 16.316 11.1818 16.6008Z" fill="url(#paint0_linear_1121_7978)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M12.3798 5.08785C13.147 4.32065 14.1876 3.88965 15.2725 3.88965H20.1816C20.6335 3.88965 20.9998 4.25596 20.9998 4.70783V16.9806C20.9998 17.4324 20.6335 17.7987 20.1816 17.7987H14.4544C14.0204 17.7987 13.6042 17.9711 13.2973 18.278C12.9904 18.5849 12.818 19.0011 12.818 19.4351C12.818 19.887 12.4517 20.2533 11.9998 20.2533C11.548 20.2533 11.1816 19.887 11.1816 19.4351V7.98056C11.1816 6.89558 11.6126 5.85504 12.3798 5.08785ZM12.818 16.6008C13.3113 16.316 13.8749 16.1624 14.4544 16.1624H19.3635V5.52601H15.2725C14.6216 5.52601 13.9972 5.78462 13.5369 6.24493C13.0766 6.70525 12.818 7.32957 12.818 7.98056V16.6008Z" fill="url(#paint1_linear_1121_7978)"/>
      <defs>
      <linearGradient id="paint0_linear_1121_7978" x1="7.90909" y1="3.88965" x2="7.90909" y2="20.2533" gradientUnits="userSpaceOnUse">
      <stop stop-color="#10808C"/>
      <stop offset="1" stop-color="#1DF7EF"/>
      </linearGradient>
      <linearGradient id="paint1_linear_1121_7978" x1="16.0907" y1="3.88965" x2="16.0907" y2="20.2533" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FE5468"/>
      <stop offset="1" stop-color="#FFDF27"/>
      </linearGradient>
      </defs>`,
    },
    "file-text": {
      body: `<path fill-rule="evenodd" clip-rule="evenodd" d="M5.68342 3.71892C6.121 3.2586 6.7145 3 7.33333 3H13.5556C13.7618 3 13.9597 3.0862 14.1055 3.23964L18.7722 8.14873C18.9181 8.30217 19 8.51028 19 8.72727V18.5455C19 19.1964 18.7542 19.8208 18.3166 20.2811C17.879 20.7414 17.2855 21 16.6667 21H7.33333C6.71449 21 6.121 20.7414 5.68342 20.2811C5.24583 19.8208 5 19.1964 5 18.5455V5.45455C5 4.80356 5.24583 4.17924 5.68342 3.71892ZM7.33333 4.63636C7.12705 4.63636 6.92922 4.72256 6.78336 4.876C6.6375 5.02944 6.55556 5.23755 6.55556 5.45455V18.5455C6.55556 18.7625 6.6375 18.9706 6.78336 19.124C6.92922 19.2774 7.12705 19.3636 7.33333 19.3636H16.6667C16.8729 19.3636 17.0708 19.2774 17.2166 19.124C17.3625 18.9706 17.4444 18.7624 17.4444 18.5455V9.06617L13.2334 4.63636H7.33333Z" fill="url(#paint0_linear_1121_7987)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M13.75 3C14.1642 3 14.5 3.39175 14.5 3.875V8.25H18.25C18.6642 8.25 19 8.64175 19 9.125C19 9.60825 18.6642 10 18.25 10H13.75C13.3358 10 13 9.60825 13 9.125V3.875C13 3.39175 13.3358 3 13.75 3Z" fill="url(#paint1_linear_1121_7987)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M8 13C8 12.4477 8.35817 12 8.8 12H15.2C15.6418 12 16 12.4477 16 13C16 13.5523 15.6418 14 15.2 14H8.8C8.35817 14 8 13.5523 8 13Z" fill="url(#paint2_linear_1121_7987)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M8 16C8 15.4477 8.35817 15 8.8 15H15.2C15.6418 15 16 15.4477 16 16C16 16.5523 15.6418 17 15.2 17H8.8C8.35817 17 8 16.5523 8 16Z" fill="url(#paint3_linear_1121_7987)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M8 10C8 9.44772 8.33579 9 8.75 9H10.25C10.6642 9 11 9.44772 11 10C11 10.5523 10.6642 11 10.25 11H8.75C8.33579 11 8 10.5523 8 10Z" fill="url(#paint4_linear_1121_7987)"/>
      <defs>
      <linearGradient id="paint0_linear_1121_7987" x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
      <stop stop-color="#10808C"/>
      <stop offset="1" stop-color="#1DF7EF"/>
      </linearGradient>
      <linearGradient id="paint1_linear_1121_7987" x1="16" y1="3" x2="16" y2="10" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FE5468"/>
      <stop offset="1" stop-color="#FFDF27"/>
      </linearGradient>
      <linearGradient id="paint2_linear_1121_7987" x1="12" y1="12" x2="12" y2="14" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FE5468"/>
      <stop offset="1" stop-color="#FFDF27"/>
      </linearGradient>
      <linearGradient id="paint3_linear_1121_7987" x1="12" y1="15" x2="12" y2="17" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FE5468"/>
      <stop offset="1" stop-color="#FFDF27"/>
      </linearGradient>
      <linearGradient id="paint4_linear_1121_7987" x1="9.5" y1="9" x2="9.5" y2="11" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FE5468"/>
      <stop offset="1" stop-color="#FFDF27"/>
      </linearGradient>
      </defs>`,
    },
    compass: {
      body: `<path fill-rule="evenodd" clip-rule="evenodd" d="M12 4.60609C7.93318 4.60609 4.63636 7.9029 4.63636 11.9697C4.63636 16.0366 7.93318 19.3334 12 19.3334C16.0668 19.3334 19.3636 16.0366 19.3636 11.9697C19.3636 7.9029 16.0668 4.60609 12 4.60609ZM3 11.9697C3 6.99916 7.02944 2.96973 12 2.96973C16.9706 2.96973 21 6.99916 21 11.9697C21 16.9403 16.9706 20.9697 12 20.9697C7.02944 20.9697 3 16.9403 3 11.9697Z" fill="url(#paint0_linear_1121_8000)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M15.7764 8.19333C15.9808 8.39778 16.0522 8.7002 15.9608 8.9745L14.3425 13.8294C14.2665 14.0574 14.0876 14.2362 13.8597 14.3122L9.00477 15.9305C8.73047 16.022 8.42805 15.9506 8.2236 15.7461C8.01915 15.5417 7.94776 15.2393 8.03919 14.965L9.65751 10.11C9.73349 9.88208 9.91235 9.70321 10.1403 9.62723L14.9952 8.00892C15.2695 7.91749 15.5719 7.98888 15.7764 8.19333ZM10.9852 10.9549L9.97035 13.9994L13.0148 12.9846L14.0297 9.94007L10.9852 10.9549Z" fill="url(#paint1_linear_1121_8000)"/>
      <defs>
      <linearGradient id="paint0_linear_1121_8000" x1="12" y1="2.96973" x2="12" y2="20.9697" gradientUnits="userSpaceOnUse">
      <stop stop-color="#10808C"/>
      <stop offset="1" stop-color="#1DF7EF"/>
      </linearGradient>
      <linearGradient id="paint1_linear_1121_8000" x1="12" y1="7.96973" x2="12" y2="15.9697" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FE5468"/>
      <stop offset="1" stop-color="#FFDF27"/>
      </linearGradient>
      </defs>`,
    },
  },
  width: 24,
  height: 24,
});

export type SidebarItems = {
  name: string;
  label: string;
  page?: {
    title: string;
    description: string;
  };

  key?: string;
  icon: ReactNode;
  sidebarIcon: ReactNode;
  options: {
    // name?: string;
    label: string;
    page?: {
      title?: string;
      description: string;
      why?: string;
      icon?: string;
    };
    icon: ReactNode;
    key?: string;
    rootKey?: string;
    urlKey: string;
  }[];
  href?: string;
}[];

export const items: SidebarItems = [
  {
    name: "Home",
    label: "Home",
    key: "home",
    icon: <ArrowsRightLeftIcon className="h-5 w-5" />,
    sidebarIcon: <Icon icon="gtp:house" className="h-7 w-7 p-0.5 mx-auto " />,
    options: [],
    href: "/",
  },
  {
    name: "Fundamentals",
    label: "Fundamentals",
    key: "metrics",
    icon: <ArrowsRightLeftIcon className="h-5 w-5" />,
    sidebarIcon: (
      <Icon icon="gtp:fundamentals" className="h-7 w-7 p-0.5 mx-auto " />
    ),
    options: [
      {
        label: "Total Value Locked",
        page: {
          title: "TVL On-Chain",
          description:
            "The sum of all funds locked on the chain. Methodology and data is derived from L2Beat.com.",
          why: "TVL is a crucial metric for assessing the success of a blockchain. A high TVL indicates that users have significant trust in the chain's security and reliability, as well as confidence in the usefulness and functionality of the various applications available on the chain.",
          icon: "feather:star",
        },
        icon: <Icon icon="feather:star" className="h-4 w-4 mx-auto" />,
        key: "tvl",
        rootKey: "metricsTvl",
        urlKey: "total-value-locked",
      },
      {
        label: "Stablecoin Market Cap",
        page: {
          title: "Stablecoin Market Cap",
          description: "The sum of stablecoins that are locked on the chain.",
          why: "Stablecoin market cap is a crucial metric for evaluating the growth and development of a blockchain's decentralized finance (DeFi) ecosystem.Stables are a popular choice for use in DeFi applications such as lending, borrowing, and trading. The market cap of stablecoins on a particular chain can provide valuable insights into the level of adoption and usage of DeFi applications on the network. A high stablecoin market cap is indicative of a robust and thriving DeFi ecosystem, where users are actively engaged in utilizing the various financial applications available on the chain.",
          icon: "feather:dollar-sign",
        },
        icon: <Icon icon="feather:dollar-sign" className="h-4 w-4 mx-auto" />,
        key: "stables_mcap",
        rootKey: "metricsStablesMcap",
        urlKey: "stablecoin-market-cap",
      },
      {
        label: "Transaction Count",
        page: {
          title: "Transaction Count",
          description: "The number of daily transactions.",
          why: "The number of transactions processed on a blockchain is a reliable metric for measuring its usage. However, it should be noted that this metric alone may not provide sufficient insight into the actual value of the transactions being conducted. For instance, while some chains may have a lower transaction count, the value of these transactions may be significantly higher due to their use in decentralized finance (DeFi) applications. On the other hand, certain chains may have a higher transaction count due to their use in gaming or other applications involving lower value transactions.",
          icon: "feather:clock",
        },
        icon: <Icon icon="feather:clock" className="h-4 w-4 mx-auto" />,
        key: "txcount",
        rootKey: "metricsTxCount",
        urlKey: "transaction-count",
      },

      {
        label: "24h Contract Usage",
        page: {
          title: "24h Contract Usage",
          description:
            "The number of contracts created in the last 24 hours. Methodology and data is derived from L2Beat.com.",
          why: "",
          icon: "ion:time-outline",
        },
        icon: <Icon icon="ion:time-outline" className="h-4 w-4 mx-auto" />,
        key: "24hcontractusage",
        rootKey: "metrics24hContractUsage",
        urlKey: "24h-contract-usage",
      },
      {
        label: "Fees Paid by Users",
        page: {
          title: "Fees Paid by Users",
          description:
            "The sum of fees that were paid by users of the chain in gas fees or, in the case of chains like Immutable X,  the amount of fees that were paid to the protocol wallet.",
          why: "Fees paid by users is a critical metric for measuring a blockchain's adoption and revenue generation. A high fee revenue can be an indication that users find the chain's applications and security valuable, and are willing to pay for it. This metric is often referred to as a chain's revenue, as it reflects the total amount of income generated by the network.",
          icon: "feather:credit-card",
        },
        icon: <Icon icon="feather:credit-card" className="h-4 w-4 mx-auto" />,
        key: "fees",
        rootKey: "metricsFeesPaidToEthereum",
        urlKey: "fees-paid-by-users",
      },
      {
        label: "Transactions/Second",
        icon: (
          <Icon
            icon="ant-design:transaction-outlined"
            className="h-4 w-4 mx-auto"
          />
        ),
        key: "txpersecond",
        rootKey: "metricsTransactionsPerSecond",
        urlKey: "transactions-per-second",
      },
      {
        label: "Daily Active Addresses",
        page: {
          title: "Daily Active Addresses",
          description:
            "The number of unique daily addresses that interacted with a chain.",
          why: "Daily active addresses is a widely used metric for estimating the number of users on a blockchain network. Although it is not a perfect metric due to the possibility of a single person owning multiple addresses, it can still provide valuable insights into the overall user base of a chain. It is worth noting, however, that this metric can be influenced by Sybil attacks, where an attacker creates a large number of fake identities to artificially inflate the active address count. Therefore, while daily active addresses can be a useful measure, it should be used in conjunction with other metrics to provide a more comprehensive analysis of a chain's user activity.",
          icon: "feather:sunrise",
        },
        icon: <Icon icon="feather:sunrise" className="h-4 w-4 mx-auto" />,
        key: "daa",
        rootKey: "metricsDailyActiveAddresses",
        urlKey: "daily-active-addresses",
      },
      {
        label: "New Addresses",
        icon: <Icon icon="bx:bx-user-plus" className="h-4 w-4 mx-auto" />,
        key: "newaddresses",
        rootKey: "metricsNewAddresses",
        urlKey: "new-addresses",
      },
      {
        label: "Total Addresses",
        icon: <Icon icon="ph:address-book" className="h-4 w-4 mx-auto" />,
        key: "totaladdresses",
        rootKey: "metricsTotalAddresses",
        urlKey: "total-addresses",
      },
    ],
  },
  {
    name: "Blockspace",
    label: "Blockspace",
    icon: <LinkIcon className="h-5 w-5" />,
    sidebarIcon: <Icon icon="gtp:package" className="h-7 w-7 p-0.5 mx-auto" />,
    options: [],
    href: "",
  },
  {
    name: "Chains",
    label: "Single Chain",
    key: "chains",
    icon: <LinkIcon className="h-5 w-5" />,
    sidebarIcon: <Icon icon="gtp:link" className="h-7 w-7 p-0.5 mx-auto" />,
    options: [
      {
        label: "Ethereum",
        page: {
          description:
            "Ethereum serves as the base layer (Layer 1 or L1) for various Layer 2 (L2) scaling solutions, which aim to improve transaction throughput and reduce costs. As the foundational layer, Ethereum anchors these L2 networks, ensuring they inherit its robust security and trustlessness.",
        },
        icon: (
          <Icon
            icon="gtp:ethereum-logo-monochrome"
            className="h-5 w-5 mx-auto"
          />
        ),
        key: "ethereum",
        rootKey: "chainsEthereum",
        urlKey: "ethereum",
      },
      {
        label: "Arbitrum",
        page: {
          description:
            "Arbitrum One is developed by Offchain Labs and its mainnet launched in September 2021. It uses an optimistic rollup approach and is fully compatible with the Ethereum Virtual Machine (EVM), making it developer-friendly.",
        },
        icon: (
          <Icon
            icon="gtp:arbitrum-logo-monochrome"
            className="h-5 w-5 mx-auto"
          />
        ),
        key: "arbitrum",
        rootKey: "chainsArbitrum",
        urlKey: "arbitrum",
      },
      {
        label: "Aztec V2",
        page: {
          description: "",
        },
        icon: (
          <Icon
            icon="gtp:immutable-x-logo-monochrome"
            className="h-5 w-5 mx-auto"
          />
        ),
        key: "aztecv2",
        rootKey: "chainsAztecV2",
        urlKey: "aztec-v2",
      },
      {
        label: "Immutable X",
        page: {
          description:
            "Immutable X is an optimized game-specif zk rollup. It is designed to mint, transfer, and trade tokens and NFTs at higher volumes and zero gas fees. It is not EVM compatible but its easy-to-use APIs and SDKs aim to make development for game devs as easy as possible. It launched in April 2021.",
        },
        icon: (
          <Icon
            icon="gtp:immutable-x-logo-monochrome"
            className="h-5 w-5 mx-auto"
          />
        ),
        key: "imx",
        rootKey: "chainsImmutableX",
        urlKey: "immutable-x",
      },
      {
        label: "Loopring",
        page: {
          description: "",
        },
        icon: (
          <Icon
            icon="gtp:loopring-logo-monochrome"
            className="h-5 w-5 mx-auto"
          />
        ),
        key: "loopring",
        rootKey: "chainsLoopring",
        urlKey: "loopring",
      },
      {
        label: "Polygon zkEVM",
        page: {
          description:
            "Polygon zkEVM uses zero-knowledge proofs to enable faster and cheaper transactions. It allows users to build and run EVM-compatible smart contracts, achieving up to 100x lower gas fees and up to 2,000x faster transaction speeds than the Ethereum mainnet. It's fully compatible with the Ethereum Virtual Machine, making it easy for developers to migrate their applications to the Polygon network. It launched in March 2023.",
        },
        icon: (
          <Icon
            icon="gtp:polygon-zkevm-logo-monochrome"
            className="h-5 w-5 mx-auto"
          />
        ),
        key: "polygon_zkevm",
        rootKey: "chainsPolygon",
        urlKey: "polygon-zkevm",
      },
      {
        label: "Optimism",
        page: {
          description:
            "Optimism uses an optimistic rollup approach, where transactions are assumed to be valid unless proven otherwise, and only invalid transactions are rolled back. Optimism's mainnet launched in August 2021, making it one of the first rollups. It is fully compatible with the Ethereum Virtual Machine (EVM), making it easy for developers to migrate their applications to the Optimism network.",
        },
        icon: (
          <Icon
            icon="gtp:optimism-logo-monochrome"
            className="h-5 w-5 mx-auto"
          />
        ),
        key: "optimism",
        rootKey: "chainsOptimism",
        urlKey: "optimism",
      },
    ],
  },

  {
    name: "Wiki",
    label: "Wiki",
    icon: <LinkIcon className="h-5 w-5" />,
    sidebarIcon: (
      <Icon icon="gtp:book-open" className="h-7 w-7 p-0.5 pb-0 mx-auto" />
    ),
    options: [],
    href: "https://docs.growthepie.xyz/",
  },
  {
    name: "API Documentation",
    label: "API Documentation",
    icon: <LinkIcon className="h-5 w-5" />,
    sidebarIcon: (
      <Icon icon="gtp:file-text" className="h-7 w-7 p-0.5 mx-auto" />
    ),
    options: [],
    href: "https://docs.growthepie.xyz/api",
  },
];

type SidebarProps = {
  // items: SidebarItems;
  trigger: ReactNode;
  className?: string;
  open?: boolean;
  onToggle?: () => void;
  onOpen?: () => void;
  onClose?: () => void;
  children?: ReactNode;
  isOpen?: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobile?: boolean;
};

export default function Sidebar({
  // items,
  trigger,
  className = "",
  open = true,
  onToggle = () => {},
  onOpen = () => {},
  onClose = () => {},
  isOpen,
  setIsOpen,
  isMobile,
}: SidebarProps) {
  const { data: master } = useSWR<MasterResponse>(MasterURL);

  // const [isOpen, setIsOpen] = useState(open);

  const isLargeScreen = useMediaQuery("(min-width: 768px)");
  const isLargerScreen = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    if (!isLargerScreen) {
      setIsOpen(false);
    }
  }, [isLargerScreen, isLargeScreen, setIsOpen]);

  // useEffect(() => {
  //   setIsOpen(open);
  // }, [open]);

  const contributors = {
    name: "Contributors",
    label: "Contributors",
    icon: <LinkIcon className="h-5 w-5" />,
    sidebarIcon: <Icon icon="gtp:compass" className="h-7 w-7 p-0.5 mx-auto" />,
    options: [],
    href: "/contributors",
  };

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    onOpen();
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  if (isMobile)
    return (
      <>
        {isOpen && (
          <>
            <div
              className="fixed bottom-0 left-0 right-0 top-0 z-10 bg-black/50 transition-all"
              onClick={() => {
                handleToggle();
              }}
            ></div>
            <div
              className={`absolute top-20 left-0 bg-forest-50 rounded-r-lg z-50 flex flex-col justify-items-start select-none overflow-hidden`}
            >
              <div className="text-forest-800 z-20 m-2 mt-10">
                <div className="">
                  {items.map((item) => (
                    <SidebarMenuGroup
                      key={item.name + "_item"}
                      item={item}
                      trigger={trigger}
                      sidebarOpen={isOpen}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
        <div
          className={`text-forest-800 ${
            isOpen ? "bg-forest-50 rounded-lg z-50" : ""
          } p-2`}
        >
          <div onClick={handleToggle} className="w-8 h-8">
            {trigger}
          </div>
        </div>
      </>
    );

  return (
    <div
      className={`flex-1 flex flex-col justify-items-start select-none ${
        isOpen ? "w-[18rem]" : "w-[5.5rem]"
      } overflow-hidden`}
    >
      {/* trigger that opens the sidebar when clicked */}
      {/* <div className="text-forest-800 z-20 mb-6 pl-6">
        <div onClick={handleToggle} className="w-6 h-6">
          {trigger}
        </div>
      </div> */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-rounded-md scrollbar-thumb-forest-800 scrollbar-track-forest-800/30 relative">
        {items.map((item) => (
          <SidebarMenuGroup
            key={item.name + "_item"}
            item={item}
            trigger={trigger}
            sidebarOpen={isOpen}
          />
        ))}
      </div>
      <div className="flex flex-col justify-end py-6 relative">
        <SidebarMenuGroup
          key={contributors.name + "_item"}
          item={contributors}
          trigger={trigger}
          sidebarOpen={isOpen}
        />
        {isOpen ? (
          <div className="text-[0.7rem] flex justify-between w-48 text-inherit dark:text-forest-400 leading-[1] ml-8">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/imprint">Imprint</Link>
            <Link href="https://discord.gg/fxjJFe7QyN">Feedback</Link>
          </div>
        ) : (
          <div className="text-[0.7rem] flex flex-col justify-between w-48 text-inherit dark:text-forest-400 leading-[2] ml-8">
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/imprint">Imprint</Link>
            <Link href="https://discord.gg/fxjJFe7QyN">Feedback</Link>
          </div>
        )}
      </div>
    </div>
  );
}
