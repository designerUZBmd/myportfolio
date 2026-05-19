"use client";
import './page.css'
import { useRevealer } from "@/hooks/useRevealer";
import Image from 'next/image'

export default function Home() {
  useRevealer();
  return (
    <>
      <div className="revealer"></div>
      <main>
        <div className="split-layout">
          <div className="split-layout__left">
            <div className="ov">
              <svg width="732" height="150%" viewBox="0 0 732 407" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M185.641 0C216.27 0 242.968 4.35196 265.733 13.0559C288.912 21.3453 308.159 32.7433 323.474 47.2498C339.202 61.7564 350.999 78.7497 358.863 98.2299C366.728 117.71 370.66 138.641 370.66 161.023C370.66 183.404 366.728 204.335 358.863 223.815C350.999 243.295 339.202 260.289 323.474 274.795C308.159 289.302 288.912 300.907 265.733 309.611C242.968 317.9 216.27 322.045 185.641 322.045C155.011 322.045 128.107 317.9 104.928 309.611C81.7486 300.907 62.2947 289.302 46.566 274.795C31.2512 260.289 19.6617 243.295 11.7973 223.815C3.93299 204.335 0.000816623 183.404 0.000816623 161.023C0.000816623 138.641 3.93299 117.71 11.7973 98.2299C19.6617 78.7497 31.2512 61.7564 46.566 47.2498C62.2947 32.7433 81.7486 21.3453 104.928 13.0559C128.107 4.35196 155.011 0 185.641 0ZM283.117 259.252C291.396 250.963 296.363 240.808 298.018 228.789C300.088 216.355 299.26 203.091 295.535 188.999C292.223 174.907 286.222 160.401 277.529 145.48C268.837 130.559 257.662 116.259 244.002 102.582C226.204 84.7596 207.371 71.082 187.503 61.5491C167.636 52.0163 149.009 47.2498 131.625 47.2498C112.999 47.2498 98.3051 52.638 87.5434 63.4143C79.6791 71.2892 74.7121 81.4438 72.6425 93.878C70.573 105.898 71.1938 118.954 74.5051 133.046C78.2304 147.138 84.4391 161.644 93.1312 176.565C101.823 191.486 112.999 205.785 126.658 219.463C144.87 237.7 163.91 251.585 183.778 261.118C203.646 270.65 222.272 275.417 239.656 275.417C257.869 275.417 272.356 270.029 283.117 259.252Z" fill="#82D9FF" />
                <path d="M0 407V344.829H715.708V407H0Z" fill="#82D9FF" />
                <path d="M732 9.31322L586.096 318.924H507.245L361.341 9.31322H447.021L546.981 221.316L646.32 9.31322H732Z" fill="#82D9FF" />
              </svg>
            </div>
          </div>
          <div className="split-layout__right">
            <section className="hero">
              <div className="tepa">
                <p className="hero__bio">
                  Men UX/UI dizayn orqali murakkab g‘oyalarni sodda
                </p>
                <div className="hero__content">
                  <span className="hero__label">SALOM /</span>
                  <div className="hero__body">
                    <Image
                      className="hero__image"
                      src="/images/photo.jpg"
                      alt="obloqulov"
                      width={527}
                      height={700}
                    />
                  </div>
                </div>
              </div>
              <div className="pas">
                <p className="hero__bio">
                  va tushunarli interfeyslarga aylantiraman. Kreativ dizayn va funksionallikni birlashtirib, barcha dizayn yo‘nalishlaridan foydalanaman.
                </p>
              </div>

            </section>

            <section className="portfolio">

            </section>
          </div>
        </div>
      </main>
    </>
  );
}
