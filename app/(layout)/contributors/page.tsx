"use client";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import { Icon, addCollection } from "@iconify/react";
import Image from "next/image";
import React from "react";
import { Contributors, Supporters, Datasources } from "@/lib/contributors";
import Link from "next/link";
import Container, { PageContainer } from "@/components/layout/Container";
import { Description } from "@/components/layout/TextComponents";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { Title } from "@/components/layout/TextHeadingComponents";

addCollection({
  prefix: "gtp",
  icons: {
    "supported-by": {
      body: `
      <path fill-rule="evenodd" clip-rule="evenodd" d="M16.5055 25.0381C16.5025 25.0351 16.498 25.0306 16.495 25.0276L16.2205 24.7531C16.15 24.8581 16.0675 24.9571 15.976 25.0501C15.598 25.4281 15.0955 25.6351 14.5615 25.6351C14.026 25.6351 13.5235 25.4281 13.1455 25.0501L7.99145 19.8946C6.79295 18.6976 6.12995 17.0701 6.14045 15.3856L5.37995 14.6251C5.06345 14.3086 5.06345 13.7971 5.37995 13.4806C5.69645 13.1641 6.20945 13.1641 6.52445 13.4806L7.53395 14.4886C7.69895 14.6536 7.78445 14.8816 7.76945 15.1141C7.68095 16.4671 8.17895 17.7931 9.13595 18.7501L14.2915 23.9041C14.3635 23.9761 14.4595 24.0166 14.5615 24.0166C14.6635 24.0166 14.7595 23.9776 14.8315 23.9041C14.9035 23.8321 14.944 23.7361 14.944 23.6341C14.944 23.5321 14.9035 23.4361 14.8315 23.3641L12.4705 21.0031C12.154 20.6881 12.154 20.1751 12.4705 19.8586C12.787 19.5421 13.3 19.5421 13.6165 19.8586L17.6515 23.8936C17.7235 23.9656 17.8195 24.0061 17.9215 24.0061C18.0235 24.0061 18.1195 23.9656 18.1915 23.8936C18.2635 23.8216 18.304 23.7256 18.304 23.6236C18.304 23.5216 18.2635 23.4256 18.1915 23.3536L14.1565 19.3171C13.84 19.0021 13.84 18.4891 14.1565 18.1726C14.473 17.8561 14.986 17.8561 15.301 18.1726L20.0335 22.9051C20.1055 22.9771 20.2015 23.0161 20.3035 23.0161C20.4055 23.0161 20.5015 22.9771 20.5735 22.9051C20.7235 22.7551 20.722 22.5136 20.5735 22.3636L19.6615 21.4516C19.657 21.4471 19.6525 21.4426 19.651 21.4426L15.889 17.6791C15.5725 17.3626 15.5725 16.8496 15.889 16.5346C16.204 16.2181 16.717 16.2181 17.0335 16.5346L20.8015 20.3011C20.95 20.4466 21.19 20.4451 21.337 20.2966C21.409 20.2246 21.4495 20.1286 21.4495 20.0266C21.4495 19.9246 21.409 19.8286 21.337 19.7566L16.0975 14.5171C15.8335 14.2531 15.784 13.8406 15.979 13.5226C16.174 13.2031 16.5625 13.0591 16.918 13.1731L19.309 13.9441C19.3255 13.9486 19.3435 13.9561 19.36 13.9621C19.4545 13.9996 19.558 13.9981 19.6525 13.9576C19.747 13.9171 19.819 13.8436 19.8565 13.7491C19.894 13.6531 19.8925 13.5496 19.852 13.4551C19.8115 13.3621 19.738 13.2901 19.642 13.2511L16.1245 11.8516L15.145 11.5216C15.0835 11.5021 15.025 11.4736 14.9695 11.4391C14.872 11.3776 14.77 11.3176 14.668 11.2636C13.8235 10.8151 12.8695 10.6381 11.9125 10.7506C11.6665 10.7791 11.4205 10.6936 11.245 10.5181C11.2435 10.5166 11.242 10.5136 11.239 10.5121L8.96495 8.05511C8.65295 7.73861 8.65445 7.22861 8.96945 6.91511C9.28595 6.59861 9.79895 6.59861 10.114 6.91511C10.117 6.91661 10.1185 6.91961 10.1215 6.92111L12.13 9.10661C13.2775 9.04511 14.41 9.29411 15.427 9.83411C15.535 9.89111 15.643 9.95261 15.748 10.0171L16.66 10.3231C16.6735 10.3276 16.6885 10.3336 16.702 10.3381L19.3675 11.4001C20.1535 10.7146 21.349 10.7461 22.096 11.4946L25.099 14.4961C25.096 14.2201 25.15 13.9441 25.2625 13.6831C25.474 13.1926 25.864 12.8131 26.3605 12.6151C26.857 12.4186 27.4015 12.4246 27.892 12.6361C28.384 12.8476 28.7635 13.2376 28.9615 13.7356L30.37 17.2741C30.376 17.2876 30.3805 17.3026 30.385 17.3161C30.385 17.3161 30.691 18.2281 30.6895 18.2251C30.754 18.3316 30.817 18.4396 30.874 18.5491C31.4155 19.5691 31.6645 20.7031 31.6 21.8551L32.356 22.6381L32.359 22.6411C32.6725 22.9576 32.671 23.4676 32.356 23.7826C32.0395 24.0991 31.5265 24.0991 31.2115 23.7826L31.2085 23.7796C31.2085 23.7796 30.187 22.7281 30.19 22.7311C30.0145 22.5556 29.929 22.3096 29.959 22.0636C30.07 21.1066 29.893 20.1541 29.4445 19.3081C29.3905 19.2061 29.3305 19.1041 29.269 19.0066C29.2345 18.9511 29.2075 18.8926 29.1865 18.8326L28.858 17.8531L27.457 14.3341C27.4195 14.2381 27.346 14.1646 27.253 14.1241C27.1585 14.0836 27.055 14.0821 26.9605 14.1196C26.764 14.1976 26.668 14.4211 26.746 14.6161C26.7535 14.6341 26.7595 14.6521 26.764 14.6671L27.535 17.0581C27.535 17.0611 27.538 17.0701 27.538 17.0731C27.5545 17.1376 27.541 17.2051 27.502 17.2591C27.4645 17.3101 27.409 17.3431 27.346 17.3506C27.346 17.3521 27.346 17.3536 27.346 17.3566C27.397 17.3506 27.4435 17.3281 27.4795 17.2921C27.4885 17.2831 27.496 17.2756 27.502 17.2666C27.544 17.2111 27.5575 17.1391 27.538 17.0731C27.55 17.1091 27.5575 17.1451 27.5635 17.1811C27.5635 17.1856 27.5635 17.1916 27.562 17.1976L27.565 17.1931C27.571 17.2321 27.5725 17.2726 27.5725 17.3131C27.5725 17.3206 27.5725 17.3281 27.5725 17.3356C27.571 17.3731 27.5665 17.4121 27.5605 17.4511C27.559 17.4526 27.556 17.4676 27.556 17.4721C27.547 17.5111 27.5365 17.5516 27.523 17.5891C27.508 17.6266 27.4915 17.6626 27.472 17.6971L27.463 17.7151C27.4465 17.7421 27.4285 17.7706 27.409 17.7961C27.3835 17.8291 27.169 18.1216 26.9725 18.5686C26.674 19.2526 26.4145 20.3041 26.974 21.3496C27.0805 21.5506 27.2155 21.7516 27.388 21.9496C27.682 22.2856 27.646 22.7971 27.31 23.0911C27.1555 23.2246 26.9665 23.2906 26.7775 23.2906C26.5525 23.2906 26.3275 23.1961 26.167 23.0131C24.451 21.0421 24.994 18.7531 25.7305 17.4181L21.4465 13.1341C21.532 13.4806 21.5215 13.8421 21.4165 14.1856L24.1735 16.9426C24.49 17.2591 24.49 17.7721 24.1735 18.0886C23.8585 18.4036 23.3455 18.4036 23.029 18.0886L20.3575 15.4156C20.3365 15.4261 20.314 15.4351 20.293 15.4456C20.032 15.5581 19.756 15.6121 19.48 15.6091L22.4815 18.6121C22.8595 18.9901 23.068 19.4926 23.068 20.0266C23.068 20.5621 22.861 21.0646 22.483 21.4426C22.3645 21.5596 22.2355 21.6601 22.096 21.7441C22.4665 22.4926 22.342 23.4271 21.718 24.0496C21.625 24.1426 21.523 24.2251 21.415 24.2971L21.958 24.8401C22.915 25.7971 24.2395 26.2951 25.594 26.2066C25.8265 26.1931 26.0545 26.2771 26.2165 26.4406L29.2855 29.4076L29.2885 29.4106C29.605 29.7271 29.605 30.2401 29.2885 30.5566C29.131 30.7141 28.924 30.7936 28.717 30.7936C28.51 30.7936 28.3015 30.7141 28.147 30.5581C28.147 30.5581 25.3255 27.8371 25.327 27.8371C23.638 27.8476 22.012 27.1846 20.8135 25.9861L19.576 24.7486C19.507 24.8521 19.426 24.9481 19.336 25.0381C18.958 25.4161 18.4555 25.6246 17.9215 25.6246C17.3875 25.6246 16.885 25.4161 16.5055 25.0381Z" fill="url(#paint0_linear_998_12424)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M13.3363 25.557C13.7008 25.851 13.7593 26.3835 13.4653 26.748L11.4598 29.244C11.2918 29.4525 11.0473 29.5605 10.7983 29.5605C10.6123 29.5605 10.4248 29.5005 10.2688 29.3745C9.90435 29.0805 9.84585 28.548 10.1398 28.1835L12.1453 25.6875C12.4378 25.323 12.9718 25.2645 13.3363 25.557ZM9.28035 23.5965C9.74085 23.52 10.1773 23.8335 10.2538 24.294C10.3288 24.756 10.0168 25.1925 9.55485 25.2675L7.36785 25.629C7.32135 25.6365 7.27485 25.6395 7.22835 25.6395C6.82185 25.6395 6.46185 25.3455 6.39435 24.93C6.31785 24.4695 6.62985 24.033 7.09185 23.9565L9.28035 23.5965ZM16.9993 27.957L17.1178 30.171C17.1433 30.6375 16.7848 31.0365 16.3183 31.062C16.3018 31.0635 16.2868 31.0635 16.2718 31.0635C15.8248 31.0635 15.4498 30.714 15.4258 30.2625L15.3073 28.047C15.2818 27.5805 15.6403 27.1815 16.1083 27.156C16.5748 27.1305 16.9738 27.489 16.9993 27.957Z" fill="url(#paint1_linear_998_12424)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M19.3405 10.1985C18.9235 9.98702 18.7555 9.47702 18.967 9.06002L20.4115 6.20252C20.623 5.78552 21.133 5.61752 21.55 5.82902C21.967 6.04052 22.135 6.54902 21.9235 6.96752L20.479 9.82502C20.3305 10.119 20.032 10.29 19.723 10.29C19.594 10.29 19.4635 10.26 19.3405 10.1985ZM23.293 11.808C22.954 11.808 22.6345 11.604 22.504 11.2695C22.333 10.833 22.549 10.3425 22.984 10.1715L25.051 9.36602C25.486 9.19502 25.978 9.41102 26.1475 9.84602C26.3185 10.2825 26.1025 10.773 25.666 10.944L23.6005 11.7495C23.5 11.79 23.395 11.808 23.293 11.808ZM15.91 8.94602L15.3355 6.80402C15.214 6.35252 15.481 5.88752 15.934 5.76602C16.3855 5.64602 16.8505 5.91302 16.972 6.36452L17.5465 8.50652C17.668 8.95802 17.3995 9.42302 16.948 9.54452C16.8745 9.56402 16.801 9.57302 16.7275 9.57302C16.354 9.57302 16.012 9.32402 15.91 8.94602Z" fill="url(#paint2_linear_998_12424)"/>
      <defs>
      <linearGradient id="paint0_linear_998_12424" x1="18.8679" y1="6.67773" x2="18.8679" y2="30.7936" gradientUnits="userSpaceOnUse">
      <stop stop-color="#10808C"/>
      <stop offset="1" stop-color="#1DF7EF"/>
      </linearGradient>
      <linearGradient id="paint1_linear_998_12424" x1="11.751" y1="23.585" x2="11.751" y2="31.0635" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FE5468"/>
      <stop offset="1" stop-color="#FFDF27"/>
      </linearGradient>
      <linearGradient id="paint2_linear_998_12424" x1="20.7561" y1="5.7373" x2="20.7561" y2="11.808" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FE5468"/>
      <stop offset="1" stop-color="#FFDF27"/>
      </linearGradient>
      </defs>
      `,
    },
    "data-sources": {
      body: `<path fill-rule="evenodd" clip-rule="evenodd" d="M18.8682 28.5C13.9032 28.5 9.86816 27.15 9.86816 25.5V22.5C9.86816 22.245 10.0032 21.99 10.1832 21.75C11.1882 23.04 14.6832 24 18.8682 24C23.0532 24 26.5482 23.04 27.5532 21.75C27.7482 21.99 27.8682 22.245 27.8682 22.5V25.5C27.8682 27.15 23.8332 28.5 18.8682 28.5ZM18.8682 21.5C13.9032 21.5 9.86816 20.15 9.86816 18.5V15.5C9.86816 15.335 9.92816 15.185 10.0032 15.035C10.0482 14.945 10.1082 14.84 10.1832 14.75C11.1882 16.04 14.6832 17 18.8682 17C23.0532 17 26.5482 16.04 27.5532 14.75C27.6282 14.84 27.6882 14.945 27.7332 15.035C27.8082 15.185 27.8682 15.35 27.8682 15.5V18.5C27.8682 20.15 23.8332 21.5 18.8682 21.5ZM18.8682 14.5C13.9032 14.5 9.86816 13.15 9.86816 11.5V8.5C9.86816 6.85 13.9032 5.5 18.8682 5.5C23.8332 5.5 27.8682 6.85 27.8682 8.5V11.5C27.8682 13.15 23.8332 14.5 18.8682 14.5ZM18.8682 7C15.5532 7 12.8682 7.675 12.8682 8.5C12.8682 9.325 15.5532 10 18.8682 10C22.1832 10 24.8682 9.325 24.8682 8.5C24.8682 7.675 22.1832 7 18.8682 7Z" stroke="url(#paint0_linear_2011_12573)" stroke-width="1.25"/>
      <circle cx="12.8682" cy="12" r="1" fill="url(#paint1_linear_2011_12573)"/>
      <circle cx="12.8682" cy="19" r="1" fill="url(#paint2_linear_2011_12573)"/>
      <circle cx="12.8682" cy="26" r="1" fill="url(#paint3_linear_2011_12573)"/>
      <defs>
      <linearGradient id="paint0_linear_2011_12573" x1="18.8682" y1="5.5" x2="18.8682" y2="28.5" gradientUnits="userSpaceOnUse">
      <stop stop-color="#10808C"/>
      <stop offset="1" stop-color="#1DF7EF"/>
      </linearGradient>
      <linearGradient id="paint1_linear_2011_12573" x1="12.8682" y1="11" x2="12.8682" y2="13" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FE5468"/>
      <stop offset="1" stop-color="#FFDF27"/>
      </linearGradient>
      <linearGradient id="paint2_linear_2011_12573" x1="12.8682" y1="18" x2="12.8682" y2="20" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FE5468"/>
      <stop offset="1" stop-color="#FFDF27"/>
      </linearGradient>
      <linearGradient id="paint3_linear_2011_12573" x1="12.8682" y1="25" x2="12.8682" y2="27" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FE5468"/>
      <stop offset="1" stop-color="#FFDF27"/>
      </linearGradient>
      </defs>`,
    },
    team: {
      body: `<path fill-rule="evenodd" clip-rule="evenodd" d="M6.57756 22.08C7.46166 21.1959 8.66076 20.6992 9.91106 20.6992H17.4539C18.7042 20.6992 19.9033 21.1959 20.7874 22.08C21.6715 22.9641 22.1682 24.1632 22.1682 25.4135V27.2992C22.1682 27.8199 21.7461 28.2421 21.2253 28.2421C20.7046 28.2421 20.2825 27.8199 20.2825 27.2992V25.4135C20.2825 24.6633 19.9845 23.9439 19.454 23.4134C18.9236 22.8829 18.2041 22.5849 17.4539 22.5849H9.91106C9.16088 22.5849 8.44142 22.8829 7.91096 23.4134C7.3805 23.9439 7.08249 24.6633 7.08249 25.4135V27.2992C7.08249 27.8199 6.66036 28.2421 6.13963 28.2421C5.61891 28.2421 5.19678 27.8199 5.19678 27.2992V25.4135C5.19678 24.1632 5.69346 22.9641 6.57756 22.08Z" fill="url(#paint0_linear_998_12415)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M13.6821 11.2705C12.1199 11.2705 10.8535 12.5369 10.8535 14.0991C10.8535 15.6612 12.1199 16.9276 13.6821 16.9276C15.2442 16.9276 16.5106 15.6612 16.5106 14.0991C16.5106 12.5369 15.2442 11.2705 13.6821 11.2705ZM8.96777 14.0991C8.96777 11.4954 11.0784 9.38477 13.6821 9.38477C16.2857 9.38477 18.3963 11.4954 18.3963 14.0991C18.3963 16.7027 16.2857 18.8133 13.6821 18.8133C11.0784 18.8133 8.96777 16.7027 8.96777 14.0991Z" fill="url(#paint1_linear_998_12415)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M16.9487 22.08C17.8328 21.1959 19.0318 20.6992 20.2822 20.6992H27.825C29.0753 20.6992 30.2744 21.1959 31.1585 22.08C32.0426 22.9641 32.5393 24.1632 32.5393 25.4135V27.2992C32.5393 27.8199 32.1172 28.2421 31.5964 28.2421C31.0757 28.2421 30.6536 27.8199 30.6536 27.2992V25.4135C30.6536 24.6633 30.3556 23.9439 29.8251 23.4134C29.2947 22.8829 28.5752 22.5849 27.825 22.5849H20.2822C19.532 22.5849 18.8125 22.8829 18.2821 23.4134C17.7516 23.9439 17.4536 24.6633 17.4536 25.4135V27.2992C17.4536 27.8199 17.0315 28.2421 16.5107 28.2421C15.99 28.2421 15.5679 27.8199 15.5679 27.2992V25.4135C15.5679 24.1632 16.0646 22.9641 16.9487 22.08Z" fill="url(#paint2_linear_998_12415)"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M24.0532 11.2705C22.491 11.2705 21.2246 12.5369 21.2246 14.0991C21.2246 15.6612 22.491 16.9276 24.0532 16.9276C25.6153 16.9276 26.8817 15.6612 26.8817 14.0991C26.8817 12.5369 25.6153 11.2705 24.0532 11.2705ZM19.3389 14.0991C19.3389 11.4954 21.4495 9.38477 24.0532 9.38477C26.6568 9.38477 28.7674 11.4954 28.7674 14.0991C28.7674 16.7027 26.6568 18.8133 24.0532 18.8133C21.4495 18.8133 19.3389 16.7027 19.3389 14.0991Z" fill="url(#paint3_linear_998_12415)"/>
      <defs>
      <linearGradient id="paint0_linear_998_12415" x1="13.6825" y1="20.6992" x2="13.6825" y2="28.2421" gradientUnits="userSpaceOnUse">
      <stop stop-color="#10808C"/>
      <stop offset="1" stop-color="#1DF7EF"/>
      </linearGradient>
      <linearGradient id="paint1_linear_998_12415" x1="13.6821" y1="9.38477" x2="13.6821" y2="18.8133" gradientUnits="userSpaceOnUse">
      <stop stop-color="#10808C"/>
      <stop offset="1" stop-color="#1DF7EF"/>
      </linearGradient>
      <linearGradient id="paint2_linear_998_12415" x1="24.0536" y1="20.6992" x2="24.0536" y2="28.2421" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FE5468"/>
      <stop offset="1" stop-color="#FFDF27"/>
      </linearGradient>
      <linearGradient id="paint3_linear_998_12415" x1="24.0532" y1="9.38477" x2="24.0532" y2="18.8133" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FE5468"/>
      <stop offset="1" stop-color="#FFDF27"/>
      </linearGradient>
      </defs>
      `,
    },
  },
  width: 36,
  height: 36,
});

export default function ContributorsPage() {
  return (
    <PageContainer gapSize="lg">
      {/* <div className="flex flex-col gap-y-[15px]">
        <div className="flex gap-x-[8px] items-center pb-[15px]">
          <div className="w-[36px] h-[36px]">
            <GTPIcon icon="gtp-data" size="lg" />
          </div>
          <Heading
            as="h2"
            className="leading-[120%] text-[30px] break-inside-avoid"
          >
            Data Sources
          </Heading>
        </div>
        <Description className="!pb-[15px]">
          The majority of our data is <span className="font-bold">done through our own raw data aggregation from RPCs</span>. However, we also source some data from:
        </Description>
      </div> */}
      <Title
        title="Data Sources"
        titleSize="md"
        icon="gtp-data"
        iconSize="lg"
        as="h2"
      />
      <Description>
        The majority of our data is <span className="font-bold">done through our own raw data aggregation from RPCs</span>. However, we also source some data from:
      </Description>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-center gap-[30px] pt-[16px] pb-[16px]">
        {Datasources.map((s) => (
          <Link
            key={s.name}
            target="_blank"
            rel="noopener noreferrer"
            href={s.url}
            className="relative text-center"
            style={{
              width: s.width,
              height: s.height,
            }}
          >
            <Image
              src={s.image}
              alt={s.name}

              className="brightness-[.55] grayscale dark:brightness-100"
              fill
              objectFit="contain"
            />
          </Link>
        ))}
      </div>
      <div className="flex flex-col gap-y-[15px]">
        <div className="flex gap-x-[8px] items-center pb-[15px]">
          <div className="w-[36px] h-[36px]">
            <GTPIcon icon="gtp-team" size="lg" />
          </div>
          <Heading
            as="h2"
            className="leading-[120%] text-[30px] break-inside-avoid"
          >
            Team
          </Heading>
        </div>
      </div>
      <div className="w-full flex flex-wrap justify-center sm:justify-start place-items-center gap-[15px]">
        {Contributors.map((c) => (
          <div
            key={c.name}
            className="w-[258px] h-[335px] flex flex-col items-stretch p-[15px] bg-forest-50 dark:bg-forest-900 rounded-xl"
          >
            <div className="relative w-full aspect-square">
              <Image
                src={c.image}
                alt={c.name}
                className="rounded-md"
                // width={228}
                // height={228}
                fill
              />
            </div>
            <div className="text-left text-base sm:text-xl mt-3 md:mt-5 font-semibold">
              {c.name}
            </div>
            <div className="flex justify-between mt-1">
              <div className="text-base">{c.role}</div>
              <div className="flex space-x-2">
                {c.linkedin && (
                  <Link
                    target="_blank"
                    rel="noopener noreferrer"
                    href={c.linkedin}
                  >
                    <Icon icon="feather:linkedin" className="w-[24px] h-[24px]" />
                  </Link>
                )}
                {c.twitter && (
                  <Link
                    target="_blank"
                    rel="noopener noreferrer"
                    href={c.twitter}
                  >
                    <Icon icon="ri:twitter-x-fill" className="w-[24px] h-[24px]" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
  return (
    <Container
      className="mx-auto pt-[65px] md:pt-[30px] flex flex-col"
      isPageRoot
    >
      <Heading className="text-[48px] mb-[30px] leading-snug" as="h1">
        Contributors
      </Heading>
      <Subheading className="text-base mb-[45px] leading-snug">
        The people who make it happen
      </Subheading>

      <div className="bg-forest-50 dark:bg-forest-900 rounded-full px-5 py-3 flex space-x-2 mb-[45px]">
        <Icon icon="gtp:supported-by" className="w-9 h-9" />
        <Heading className="text-3xl font-semibold leading-snug">
          Supported By
        </Heading>
      </div>

      <div className="mb-[90px]">
        <div className="grid grid-cols-2 lg:grid-cols-4 items-center justify-items-center gap-x-[45px] gap-y-[30px] mx-5">

          {Supporters.map((s) => (

            <Link
              key={s.name}
              target="_blank"
              rel="noopener noreferrer"
              href={s.url}
              className="relative text-center h-[98px] md:h-[98px] w-full flex items-center justify-center"

            >
              <div className="w-full">
                <s.svg />
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-forest-50 dark:bg-forest-900 rounded-full px-5 py-3 flex space-x-2 mb-[15px]">
        <Icon icon="gtp:data-sources" className="w-9 h-9" />
        <Heading className="text-3xl font-semibold leading-snug">
          Data Sources
        </Heading>
      </div>
      <div className="px-[30px] mb-[15px] py-[10px]">
        <div>
          In addition to own raw data aggregation, we also source some data
          from:
        </div>
      </div>
      <div className="mb-[90px]">
        <div className="grid grid-cols-2 lg:grid-cols-3 items-center justify-items-center gap-x-[45px] gap-y-[30px] mx-5">
          {Datasources.map((s) => (
            <Link
              key={s.name}
              target="_blank"
              rel="noopener noreferrer"
              href={s.url}
              className="relative text-center"
            // style={{
            //   width: s.width,
            //   height: s.height,
            // }}
            >
              <Image
                src={s.image}
                alt={s.name}
                width={s.width}
                height={s.height}
                className="brightness-[.55] grayscale dark:brightness-100"
              // fill
              />
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-[30px] bg-forest-50 dark:bg-forest-900 rounded-full px-5 py-3 flex space-x-2">
        <Icon icon="gtp:team" className="w-9 h-9" />
        <Heading className="text-3xl font-semibold leading-snug">Team</Heading>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-2 gap-y-2 md:gap-y-[30px]">
        {Contributors.map((c) => (
          <div
            key={c.name}
            className="basis-1/4 flex flex-col items-stretch p-[15px] bg-forest-50 dark:bg-forest-900 rounded-xl"
          >
            <div className="relative w-full aspect-square">
              <Image
                src={c.image}
                alt={c.name}
                className="rounded-md"
                // width={228}
                // height={228}
                fill
              />
            </div>
            <div className="text-left text-base sm:text-xl mt-3 md:mt-5 font-semibold">
              {c.name}
            </div>
            <div className="flex justify-between mt-1">
              <div className="text-base">{c.role}</div>
              <div className="flex space-x-2">
                {c.linkedin && (
                  <Link
                    target="_blank"
                    rel="noopener noreferrer"
                    href={c.linkedin}
                  >
                    <Icon icon="feather:linkedin" className="w-[24px] h-[24px]" />
                  </Link>
                )}
                {c.twitter && (
                  <Link
                    target="_blank"
                    rel="noopener noreferrer"
                    href={c.twitter}
                  >
                    <Icon icon="ri:twitter-x-fill" className="w-[24px] h-[24px]" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}

