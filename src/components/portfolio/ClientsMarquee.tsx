"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import "./ClientsMarquee.css";

export interface ClientCardData {
  id: string;
  name: string;
  height: number; // Staggered height in px
  logo: React.ReactNode;
}

const clientsData: ClientCardData[] = [
  {
    id: "payme",
    name: "PAYME",
    height: 280,
    logo: (
      <svg className="client-logo-svg" viewBox="0 0 130 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 7H24C28.4 7 31.5 9.8 31.5 13.8C31.5 17.8 28.4 20.6 24 20.6H18.2V30H12.5V7ZM18.2 16H23.5C25.4 16 26.5 15.1 26.5 13.8C26.5 12.5 25.4 11.6 23.5 11.6H18.2V16Z" fill="currentColor"/>
        <path d="M36.5 20.4C36.5 15 40.2 11.2 45.5 11.2C50.8 11.2 54.5 15 54.5 20.4V30H49.5V20.4C49.5 17.6 47.6 15.8 45.5 15.8C43.4 15.8 41.5 17.6 41.5 20.4V30H36.5V20.4Z" fill="currentColor"/>
        <path d="M60.5 11.6H66.2L72 24.2L77.8 11.6H83.5L75 28.5L72 34.5H66.5L69.8 28L60.5 11.6Z" fill="currentColor"/>
        <path d="M88.5 7H93.8V30H88.5V7Z" fill="currentColor"/>
        <path d="M98 20.5C98 15.2 101.8 11.2 107.2 11.2C112.6 11.2 116 15.2 116 20.5V21.6H103C103.2 24.2 105 25.8 107.5 25.8C109.5 25.8 110.8 25 111.5 23.5H116.2C115.2 27.2 111.8 30 107.2 30C101.8 30 98 25.8 98 20.5ZM111.2 18C111 15.8 109.4 14.8 107.2 14.8C105 14.8 103.4 15.8 103.1 18H111.2Z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: "uzum",
    name: "UZUM",
    height: 190,
    logo: (
      <svg className="client-logo-svg" viewBox="0 0 135 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="14" r="3.5" fill="currentColor"/>
        <circle cx="23" cy="14" r="3.5" fill="currentColor"/>
        <circle cx="19" cy="21" r="3.5" fill="currentColor"/>
        <circle cx="19" cy="28" r="3.5" fill="currentColor"/>
        <path d="M34 11H39.5V23C39.5 25.8 41.5 27.5 44 27.5C46.5 27.5 48.5 25.8 48.5 23V11H54V23C54 28.5 49.5 32.5 44 32.5C38.5 32.5 34 28.5 34 23V11Z" fill="currentColor"/>
        <path d="M59 11H74V15.5L64.5 27.5H74.5V32H58.5V27.5L68 15.5H59V11Z" fill="currentColor"/>
        <path d="M79 11H84.5V23C84.5 25.8 86.5 27.5 89 27.5C91.5 27.5 93.5 25.8 93.5 23V11H99V23C99 28.5 94.5 32.5 89 32.5C83.5 32.5 79 28.5 79 23V11Z" fill="currentColor"/>
        <path d="M104 11H109.5V17.5C110.8 15.2 113.2 13.8 116 13.8C118.5 13.8 120.8 15 121.8 17C123.5 15 125.8 13.8 128.5 13.8C133 13.8 136 17 136 22V32H130.5V22.5C130.5 20 129 18.5 127 18.5C125 18.5 123.5 20 123.5 22.5V32H118V22.5C118 20 116.5 18.5 114.5 18.5C112.5 18.5 111 20 111 22.5V32H105.5V11H104Z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: "epam",
    name: "EPAM",
    height: 330,
    logo: (
      <svg className="client-logo-svg" viewBox="0 0 130 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 18L18 10H22L16 18L22 26H18L12 18Z" fill="currentColor"/>
        <path d="M26 10H42V14H31V16H40V20H31V22H42V26H26V10Z" fill="currentColor"/>
        <path d="M46 10H56C60.5 10 63.5 12.8 63.5 16.8C63.5 20.8 60.5 23.6 56 23.6H51.2V26H46V10ZM51.2 19.5H55.5C57.4 19.5 58.5 18.5 58.5 16.8C58.5 15.1 57.4 14.1 55.5 14.1H51.2V19.5Z" fill="currentColor"/>
        <path d="M72 10H77.5L85.5 26H80L78.2 22H71.3L69.5 26H64L72 10ZM76.7 18.2L74.8 13.8L72.8 18.2H76.7Z" fill="currentColor"/>
        <path d="M89 10H95L99.5 18.5L104 10H110V26H105V15.5L100.5 24H98.5L94 15.5V26H89V10Z" fill="currentColor"/>
        <path d="M118 18L112 10H108L114 18L108 26H112L118 18Z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: "click",
    name: "CLICK",
    height: 220,
    logo: (
      <svg className="client-logo-svg" viewBox="0 0 130 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 7C12.8 7 7 12.8 7 20C7 27.2 12.8 33 20 33C25.5 33 30.2 29.5 32 24.5H26C24.8 26.8 22.5 28.2 20 28.2C15.5 28.2 11.8 24.5 11.8 20C11.8 15.5 15.5 11.8 20 11.8C22.5 11.8 24.8 13.2 26 15.5H32C30.2 10.5 25.5 7 20 7Z" fill="currentColor"/>
        <path d="M37 7H42V33H37V7Z" fill="currentColor"/>
        <path d="M48 7H53V33H48V7Z" fill="currentColor"/>
        <path d="M68 7C60.8 7 55 12.8 55 20C55 27.2 60.8 33 68 33C73.5 33 78.2 29.5 80 24.5H74C72.8 26.8 70.5 28.2 68 28.2C63.5 28.2 59.8 24.5 59.8 20C59.8 15.5 63.5 11.8 68 11.8C70.5 11.8 72.8 13.2 74 15.5H80C78.2 10.5 73.5 7 68 7Z" fill="currentColor"/>
        <path d="M85 7H90V18.5L98.5 7H105L95.5 19.5L105.5 33H99L91.8 23L90 25.2V33H85V7Z" fill="currentColor"/>
        <circle cx="114" cy="20" r="4.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: "kapital",
    name: "KAPITALBANK",
    height: 300,
    logo: (
      <svg className="client-logo-svg" viewBox="0 0 150 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L28 12V24L18 30L8 24V12L18 6ZM18 10L12 13.8V22.2L18 26L24 22.2V13.8L18 10Z" fill="currentColor"/>
        <text x="36" y="24" fontFamily="inherit" fontSize="15" fontWeight="800" letterSpacing="0.06em" fill="currentColor">KAPITALBANK</text>
      </svg>
    ),
  },
  {
    id: "yandex",
    name: "YANDEX",
    height: 170,
    logo: (
      <svg className="client-logo-svg" viewBox="0 0 130 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 7L21 19.5V31H26V19.5L33 7H27.5L23.5 15L19.5 7H14Z" fill="currentColor"/>
        <path d="M35 15H40L45.5 28.5H41L39.8 25.5H35.2L34 28.5H29.5L35 15ZM38.8 22L37.5 18.5L36.2 22H38.8Z" fill="currentColor"/>
        <path d="M46 15H51V17.8C52.2 15.8 54.8 14.5 57.5 14.5C62.5 14.5 66 18.2 66 23.5V31H61V23.5C61 20.5 59.2 18.8 56.8 18.8C54.4 18.8 52.6 20.5 52.6 23.5V31H47.6V15H46Z" fill="currentColor"/>
        <path d="M68 8H73V17.5C74.5 15.5 77 14.5 79.5 14.5C85 14.5 89 18.5 89 24C89 29.5 85 33.5 79.5 33.5C77 33.5 74.5 32.5 73 30.5V33H68V8ZM78.5 29C81.8 29 84 26.8 84 24C84 21.2 81.8 19 78.5 19C75.2 19 73 21.2 73 24C73 26.8 75.2 29 78.5 29Z" fill="currentColor"/>
        <path d="M91 24C91 18.5 95 14.5 100.5 14.5C106 14.5 110 18.5 110 24V25H96C96.2 27.5 98 29.2 100.5 29.2C102.5 29.2 104 28.2 104.8 26.8H109.8C108.8 30.5 105.2 33.5 100.5 33.5C95 33.5 91 29.5 91 24ZM105 21.5C104.8 19.2 103 18 100.5 18C98 18 96.5 19.2 96.2 21.5H105Z" fill="currentColor"/>
        <path d="M112 15H117L120.5 21L124 15H129L123.5 23.5L129.5 32H124.5L120.5 25.8L116.5 32H111.5L117.5 23.5L112 15Z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: "itpark",
    name: "IT PARK",
    height: 320,
    logo: (
      <svg className="client-logo-svg" viewBox="0 0 130 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 6L28 13V27L16 34L4 27V13L16 6ZM16 11L9 15.2V24.8L16 29L23 24.8V15.2L16 11Z" fill="currentColor"/>
        <path d="M16 11V29" stroke="currentColor" strokeWidth="2.5"/>
        <text x="36" y="24" fontFamily="inherit" fontSize="17" fontWeight="800" letterSpacing="0.08em" fill="currentColor">IT PARK</text>
      </svg>
    ),
  },
  {
    id: "apex",
    name: "APEX",
    height: 200,
    logo: (
      <svg className="client-logo-svg" viewBox="0 0 120 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 6L28 29H21.5L16 16.5L10.5 29H4L16 6ZM16 11.5L12 21H20L16 11.5Z" fill="currentColor"/>
        <text x="36" y="24" fontFamily="inherit" fontSize="16" fontWeight="800" letterSpacing="0.08em" fill="currentColor">APEX</text>
      </svg>
    ),
  },
  {
    id: "anor",
    name: "ANORBANK",
    height: 290,
    logo: (
      <svg className="client-logo-svg" viewBox="0 0 145 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="19" r="11" stroke="currentColor" strokeWidth="2.5" fill="none"/>
        <path d="M16 8L13 5H19L16 8Z" fill="currentColor"/>
        <circle cx="16" cy="19" r="3.5" fill="currentColor"/>
        <text x="36" y="24" fontFamily="inherit" fontSize="15" fontWeight="800" letterSpacing="0.06em" fill="currentColor">ANORBANK</text>
      </svg>
    ),
  },
  {
    id: "humo",
    name: "HUMO",
    height: 180,
    logo: (
      <svg className="client-logo-svg" viewBox="0 0 130 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 8C18 8 24 13 24 20C24 27 18 32 10 32C15 27 18 24 18 20C18 16 15 13 10 8Z" fill="currentColor"/>
        <path d="M4 14C9 14 13 17 13 20C13 23 9 26 4 26C7 23 9 21.5 9 20C9 18.5 7 17 4 14Z" fill="currentColor"/>
        <text x="32" y="25" fontFamily="inherit" fontSize="18" fontWeight="900" letterSpacing="0.08em" fill="currentColor">HUMO</text>
      </svg>
    ),
  },
  {
    id: "tbc",
    name: "TBC BANK",
    height: 310,
    logo: (
      <svg className="client-logo-svg" viewBox="0 0 130 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="8" y="24" fontFamily="inherit" fontSize="17" fontWeight="900" letterSpacing="0.06em" fill="currentColor">TBC BANK</text>
      </svg>
    ),
  },
  {
    id: "nova",
    name: "NOVA AI",
    height: 210,
    logo: (
      <svg className="client-logo-svg" viewBox="0 0 130 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="18" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 3" fill="none"/>
        <circle cx="15" cy="18" r="3.5" fill="currentColor"/>
        <text x="32" y="24" fontFamily="inherit" fontSize="16" fontWeight="800" letterSpacing="0.08em" fill="currentColor">NOVA.AI</text>
      </svg>
    ),
  },
];

export default function ClientsMarquee() {
  const trackRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Smooth continuous horizontal marquee scroll
    tweenRef.current = gsap.to(track, {
      xPercent: -50,
      ease: "none",
      duration: 38,
      repeat: -1,
    });

    return () => {
      tweenRef.current?.kill();
    };
  }, []);

  const handleMouseEnter = () => {
    if (tweenRef.current) {
      gsap.to(tweenRef.current, {
        timeScale: 0,
        duration: 0.8,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const handleMouseLeave = () => {
    if (tweenRef.current) {
      gsap.to(tweenRef.current, {
        timeScale: 1,
        duration: 0.8,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  return (
    <section className="clients-section">
      <div
        className="clients-marquee"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div ref={trackRef} className="clients-marquee__track">
          {/* First Sequence */}
          {clientsData.map((client, idx) => (
            <div
              key={`c1-${client.id}-${idx}`}
              className="client-card"
              style={{ height: `${client.height}px` }}
            >
              <div className="client-card__logo-wrap">
                {client.logo}
              </div>
            </div>
          ))}

          {/* Duplicated Sequence for Infinite Loop */}
          {clientsData.map((client, idx) => (
            <div
              key={`c2-${client.id}-${idx}`}
              className="client-card"
              style={{ height: `${client.height}px` }}
            >
              <div className="client-card__logo-wrap">
                {client.logo}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
