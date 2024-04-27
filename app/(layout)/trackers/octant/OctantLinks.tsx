"use client";
import React from "react";
import Link from "next/link";
import Icon from "@/components/layout/Icon";
import { track } from "@vercel/analytics/react";

export const OctantLinks = () => {
  return (
    <div className="hidden lg:flex flex-row-reverse gap-x-[10px] text-sm items-start">
      <div className="peer group relative">
        <div
          className={`relative !z-[21] flex items-center gap-x-[8px] font-semibold border border-forest-50 dark:border-forest-900 bg-forest-50 dark:bg-forest-900 transition-all duration-300 rounded-full px-[16px] py-[7px] w-[91px] group-hover:w-[220px] delay-0`}
        >
          <Icon
            icon="feather:chevron-right"
            className={`w-4 h-4 transition-transform duration-300 transform group-hover:rotate-90`}
          />
          <div>More</div>
        </div>

        <div className="absolute top-[15px] left-0 !z-[20] h-0 delay-0 group-hover:h-[190px] overflow-hidden transition-all duration-300 ease-in-out bg-forest-50 dark:bg-forest-1000 rounded-b-[22px] group-hover:pt-[29px] group-hover:pb-[10px] break-inside-avoid w-[91px] group-hover:w-[220px] shadow-transparent group-hover:shadow-[0px_4px_46.2px_0px_#000000]">
          <Link
            href={"https://octant.build"}
            className="flex items-center gap-x-[10px] font-medium text-sm px-4 py-2 group-hover:w-[220px] w-0 transition-[width] duration-100 ease-in-out hover:bg-forest-50 dark:hover:bg-forest-900"
            target="_blank"
            onClick={() => {
              track("clicked Octant Build link", {
                location: "desktop Octant Tracker",
                page: window.location.pathname,
              });
            }}
          >
            <Icon icon="feather:external-link" className="w-4 h-4" />
            <div>Octant.Build</div>
          </Link>
          <Link
            href={"https://golem.foundation/blog/"}
            className="flex items-center gap-x-[10px] font-medium text-sm px-4 py-2 group-hover:w-[220px] w-0 transition-[width] duration-100 ease-in-out hover:bg-forest-50 dark:hover:bg-forest-900"
            target="_blank"
            onClick={() => {
              track("clicked Golem Foundation Blog link", {
                location: "desktop Octant Tracker",
                page: window.location.pathname,
              });
            }}
          >
            <Icon icon="feather:external-link" className="w-4 h-4" />
            <div>Golem Foundation Blog</div>
          </Link>
          <Link
            href={"https://twitter.com/OctantApp"}
            className="flex items-center gap-x-[10px] font-medium text-sm px-4 py-2 group-hover:w-[220px] w-0 transition-[width] duration-100 ease-in-out hover:bg-forest-50 dark:hover:bg-forest-900"
            target="_blank"
            onClick={() => {
              track("clicked Octant Twitter link", {
                location: "desktop Octant Tracker",
                page: window.location.pathname,
              });
            }}
          >
            <Icon icon="feather:twitter" className="w-4 h-4" />
            <div>
              <span className="">@</span>
              OctantApp
            </div>
          </Link>
          <Link
            href={"https://twitter.com/GolemFoundation"}
            className="flex items-center gap-x-[10px] font-medium text-sm px-4 py-2 group-hover:w-[220px] w-0 transition-[width] duration-100 ease-in-out hover:bg-forest-50 dark:hover:bg-forest-900"
            target="_blank"
            onClick={() => {
              track("clicked Golem Foundation Twitter link", {
                location: "desktop Octant Tracker",
                page: window.location.pathname,
              });
            }}
          >
            <Icon icon="feather:twitter" className="w-4 h-4" />
            <div>
              <span className="">@</span>
              GolemFoundation
            </div>
          </Link>
        </div>
      </div>
      <Link
        href={"https://docs.octant.app/"}
        // className="flex items-center gap-x-[8px] justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-[16px] py-2"
        className="flex items-center gap-x-[8px] justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-[16px] py-[8px] transition-all duration-300 peer-hover:[&>div]:w-[0px] [&>div]:w-[82px] peer-hover:gap-x-0"
        target="_blank"
        onClick={() => {
          track("clicked Octant Docs link", {
            location: "desktop Octant Tracker",
            page: window.location.pathname,
          });
        }}
      >
        <Icon icon="fluent:book-open-16-filled" className="w-4 h-4" />
        <div className="transition-all duration-300 whitespace-nowrap overflow-hidden">
          Octant Docs
        </div>
      </Link>
      {true && (
        <Link
          href={"https://octant.app"}
          className="flex p-[1px] bg-gradient-to-b from-[#FE5468] to-[#FFDF27] rounded-full peer-hover:[&>div>div]:w-[0px] [&>div>div]:w-[76px] peer-hover:[&>div]:gap-x-0"
          target="_blank"
          onClick={() => {
            track("clicked Octant App link", {
              location: "desktop Octant Tracker",
              page: window.location.pathname,
            });
          }}
        >
          <div className="flex items-center gap-x-[8px] justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-[16px] py-[7px] transition-all duration-300">
            <svg className="w-4 h-4" data-test="Svg" viewBox="7 10 26 19">
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M 40 20 Z Z m -27.067 6.058 a 6.06 6.06 0 0 0 5.588 -3.715 a 9.095 9.095 0 0 0 7.854 6.697 c 0.78 0.08 0.929 -0.056 0.929 -0.9 v -3.62 c 0 -0.707 0.239 -1.491 1.371 -1.491 h 2.172 c 0.468 0 0.487 -0.01 0.752 -0.385 c 0 0 1.139 -1.59 1.365 -1.928 c 0.226 -0.338 0.203 -0.426 0 -0.716 S 31.6 18.106 31.6 18.106 c -0.266 -0.37 -0.288 -0.378 -0.752 -0.378 h -2.893 c -0.473 0 -0.65 0.252 -0.65 0.757 v 2.627 c 0 0.64 0 1.16 -0.93 1.16 c -1.35 0 -2.082 -1.017 -2.082 -2.272 c 0 -1.1 0.816 -2.227 2.083 -2.227 c 0.852 0 0.929 -0.204 0.929 -0.613 v -5.49 c 0 -0.72 -0.314 -0.773 -0.93 -0.71 a 9.095 9.095 0 0 0 -7.852 6.696 A 6.06 6.06 0 0 0 6.874 20 a 6.058 6.058 0 0 0 6.058 6.058 Z m 0 -4.039 a 2.02 2.02 0 1 0 0 -4.039 a 2.02 2.02 0 0 0 0 4.04 Z"
              ></path>

              <defs>
                <clipPath id="octant">
                  <path fill="#fff" d="M0 0h40v40H0z"></path>
                </clipPath>
              </defs>
            </svg>
            <div className="transition-all duration-300 whitespace-nowrap overflow-hidden">
              Octant App
            </div>
          </div>
        </Link>
      )}
    </div>
  );
};

export const OctantLinksMobile = () => {
  return (
    <div className="flex lg:hidden flex-row-reverse gap-x-[10px] justify-between text-sm pt-[15px] lg:pt-[15px]">
      <div className="peer group relative">
        <div
          className={`relative !z-[21] flex items-center gap-x-[8px] font-semibold border border-forest-50 dark:border-forest-900 bg-forest-50 dark:bg-forest-900 transition-all duration-300 rounded-full px-[16px] py-[7px] w-[91px] group-hover:w-[220px] delay-0`}
        >
          <Icon
            icon="feather:chevron-right"
            className={`w-4 h-4 transition-transform duration-300 transform group-hover:rotate-90`}
          />
          <div>More</div>
        </div>

        <div className="absolute top-[15px] left-0 !z-[20] h-0 delay-0 group-hover:h-[190px] overflow-hidden transition-all duration-300 ease-in-out bg-forest-50 dark:bg-forest-1000 rounded-b-[22px] group-hover:pt-[29px] group-hover:pb-[10px] break-inside-avoid w-[91px] group-hover:w-[220px] shadow-transparent group-hover:shadow-[0px_4px_46.2px_0px_#000000]">
          <Link
            href={"https://octant.build"}
            className="flex items-center gap-x-[10px] font-medium text-sm px-4 py-2 group-hover:w-[220px] w-0 transition-[width] duration-100 ease-in-out hover:bg-forest-50 dark:hover:bg-forest-900"
            target="_blank"
            onClick={() => {
              track("clicked Octant Build link", {
                location: "mobile Octant Tracker",
                page: window.location.pathname,
              });
            }}
          >
            <Icon icon="feather:external-link" className="w-4 h-4" />
            <div>Octant.Build</div>
          </Link>
          <Link
            href={"https://golem.foundation/blog/"}
            className="flex items-center gap-x-[10px] font-medium text-sm px-4 py-2 group-hover:w-[220px] w-0 transition-[width] duration-100 ease-in-out hover:bg-forest-50 dark:hover:bg-forest-900"
            target="_blank"
            onClick={() => {
              track("clicked Golem Foundation Blog link", {
                location: "mobile Octant Tracker",
                page: window.location.pathname,
              });
            }}
          >
            <Icon icon="feather:external-link" className="w-4 h-4" />
            <div>Golem Foundation Blog</div>
          </Link>
          <Link
            href={"https://twitter.com/OctantApp"}
            className="flex items-center gap-x-[10px] font-medium text-sm px-4 py-2 group-hover:w-[220px] w-0 transition-[width] duration-100 ease-in-out hover:bg-forest-50 dark:hover:bg-forest-900"
            target="_blank"
            onClick={() => {
              track("clicked Octant Twitter link", {
                location: "mobile Octant Tracker",
                page: window.location.pathname,
              });
            }}
          >
            <Icon icon="feather:twitter" className="w-4 h-4" />
            <div>
              <span className="">@</span>
              OctantApp
            </div>
          </Link>
          <Link
            href={"https://twitter.com/GolemFoundation"}
            className="flex items-center gap-x-[10px] font-medium text-sm px-4 py-2 group-hover:w-[220px] w-0 transition-[width] duration-100 ease-in-out hover:bg-forest-50 dark:hover:bg-forest-900"
            target="_blank"
          >
            <Icon icon="feather:twitter" className="w-4 h-4" />
            <div>
              <span className="">@</span>
              GolemFoundation
            </div>
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-x-[10px] peer-hover:[&>a:first-child>div>div]:w-[0px] peer-hover:[&>a:first-child>div]:gap-x-[0px] peer-hover:[&>a:last-child>div]:w-[0px] peer-hover:[&>a:last-child]:gap-x-[0px]">
        <Link
          href={"https://octant.app"}
          className="flex p-[1px] bg-gradient-to-b from-[#FE5468] to-[#FFDF27] rounded-full peer-hover:[&>div>div]:w-[0px] [&>div>div]:w-[76px] peer-hover:[&>div]:gap-x-0"
          target="_blank"
          onClick={() => {
            track("clicked Octant App link", {
              location: "mobile Octant Tracker",
              page: window.location.pathname,
            });
          }}
        >
          <div className="flex items-center gap-x-[8px] justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-[16px] py-[7px] transition-all duration-300">
            <svg className="w-4 h-4" data-test="Svg" viewBox="7 10 26 19">
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M 40 20 Z Z m -27.067 6.058 a 6.06 6.06 0 0 0 5.588 -3.715 a 9.095 9.095 0 0 0 7.854 6.697 c 0.78 0.08 0.929 -0.056 0.929 -0.9 v -3.62 c 0 -0.707 0.239 -1.491 1.371 -1.491 h 2.172 c 0.468 0 0.487 -0.01 0.752 -0.385 c 0 0 1.139 -1.59 1.365 -1.928 c 0.226 -0.338 0.203 -0.426 0 -0.716 S 31.6 18.106 31.6 18.106 c -0.266 -0.37 -0.288 -0.378 -0.752 -0.378 h -2.893 c -0.473 0 -0.65 0.252 -0.65 0.757 v 2.627 c 0 0.64 0 1.16 -0.93 1.16 c -1.35 0 -2.082 -1.017 -2.082 -2.272 c 0 -1.1 0.816 -2.227 2.083 -2.227 c 0.852 0 0.929 -0.204 0.929 -0.613 v -5.49 c 0 -0.72 -0.314 -0.773 -0.93 -0.71 a 9.095 9.095 0 0 0 -7.852 6.696 A 6.06 6.06 0 0 0 6.874 20 a 6.058 6.058 0 0 0 6.058 6.058 Z m 0 -4.039 a 2.02 2.02 0 1 0 0 -4.039 a 2.02 2.02 0 0 0 0 4.04 Z"
              ></path>

              <defs>
                <clipPath id="octant">
                  <path fill="#fff" d="M0 0h40v40H0z"></path>
                </clipPath>
              </defs>
            </svg>
            <div className="transition-all duration-300 whitespace-nowrap overflow-hidden">
              Octant App
            </div>
          </div>
        </Link>
        <Link
          href={"https://docs.octant.app/"}
          // className="flex items-center gap-x-[8px] justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-[16px] py-2"
          className="flex items-center gap-x-[8px] justify-between font-semibold bg-forest-50 dark:bg-forest-900 rounded-full px-[16px] py-[8px] transition-all duration-300 peer-hover:[&>div]:w-[0px] [&>div]:w-[99px] peer-hover:gap-x-0"
          target="_blank"
          onClick={() => {
            track("clicked Octant Docs link", {
              location: "mobile Octant Tracker",
              page: window.location.pathname,
            });
          }}
        >
          <Icon icon="fluent:book-open-16-filled" className="w-4 h-4" />
          <div className="transition-all duration-300 whitespace-nowrap overflow-hidden">
            Octant Docs
          </div>
        </Link>
      </div>
    </div>
  );
};
