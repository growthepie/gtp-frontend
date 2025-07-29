import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import Container from "./layout/Container";
import { Pagination, Navigation } from "swiper/modules";

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
const styleString = `
                .focus-carousel {
                    overflow: visible !important;
                }
                .focus-carousel .swiper-wrapper {
                    align-items: center;
                }
                .focus-carousel .swiper-slide {
                    opacity: 0.4;
                    transform: scale(0.92);
                    transition: all 0.3s ease-in-out;
                }
                .focus-carousel .swiper-slide-fully-visible {
                    opacity: 1 !important;
                    transform: scale(1) !important;
                }
                .focus-carousel .swiper-pagination {
                    position: relative;
                    bottom: auto;
                    margin-top: 15px;
                    padding-top: 2px;
                    height: 12px;
                }
                .focus-carousel .swiper-pagination-bullet {
                    background-color: #5A6462;
                    opacity: 0.5;
                    transition: all 0.3s ease;
                }
                .focus-carousel .swiper-pagination-bullet-active {
                    background-color: #1F2726;
                    opacity: 1;
                    transform: scale(1.2);
                }
                @media (prefers-color-scheme: dark) {
                    .focus-carousel .swiper-pagination-bullet-active {
                        background-color: #CDD7D5;
                    }
                }
                @media (max-width: 1023px) {
                    .focus-carousel .swiper-slide {
                        opacity: 0.5;
                        transform: scale(0.9);
                    }
                }
                @media (max-width: 767px) {
                    .focus-carousel .swiper-slide {
                        opacity: 0.5;
                        transform: scale(0.9);
                    }
                }
            `

export default function SwiperComponent({ children }: { children: React.ReactNode }) {
    const childrenArray = React.Children.toArray(children);

    const updateVisibleSlides = (swiper: any) => {
        const slides = swiper.slides;
        const activeIndex = swiper.activeIndex;
        
        // Remove class from all slides
        slides.forEach((slide: HTMLElement) => {
            slide.classList.remove('swiper-slide-fully-visible');
        });
        
        // Add class to the first 3 visible slides at 1024px+
        const isMobile = window.innerWidth < 1024;
        const visibleCount = isMobile ? (window.innerWidth < 768 ? 1 : 1) : 3;
        
        for (let i = 0; i < visibleCount && activeIndex + i < slides.length; i++) {
            slides[activeIndex + i]?.classList.add('swiper-slide-fully-visible');
        }
    };

    return (
        <Container>
            <style>{styleString}</style>
            
            <div className="py-5">
                <Swiper
                    slidesPerView={5}
                    spaceBetween={15}
                    centeredSlides={true}
                    navigation={false}
                    pagination={{
                        clickable: true,
                        dynamicBullets: true,
                    }}
                    onSlideChange={updateVisibleSlides}
                    onSwiper={updateVisibleSlides}
                    breakpoints={{
                        320: {
                            slidesPerView: 1.3,
                            spaceBetween: 15,
                            centeredSlides: true,
                        },
                        768: {
                            slidesPerView: 1.3,
                            spaceBetween: 15,
                            centeredSlides: true,
                        },
                        1024: {
                            slidesPerView: 3.5,
                            spaceBetween: 10,
                            centeredSlides: false,
                        },
                    }}
                    modules={[Pagination, Navigation]}
                    className="focus-carousel"
                > 
                    {childrenArray.map((child, index) => (
                        <SwiperSlide key={index + "swiper"}>
                            <div className="w-full h-full">
                                {child}
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </Container>
    );
}

