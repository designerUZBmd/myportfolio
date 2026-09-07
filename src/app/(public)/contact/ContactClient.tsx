"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRevealer } from "@/hooks/useRevealer";
import "./contact.css";

const SERVICE_TAGS = [
  "Web design",
  "Mobile app",
  "3D & Spatial",
  "Branding",
  "Design system",
  "Development",
];

export default function ContactClient() {
  useRevealer();

  // Form disclosure & progression states
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Progressive unlock flags
  const [step2Unlocked, setStep2Unlocked] = useState(false);
  const [step3Unlocked, setStep3Unlocked] = useState(false);
  const [step4Unlocked, setStep4Unlocked] = useState(false);

  // Submission states
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const nameInputRef = useRef<HTMLInputElement>(null);
  const contactInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Focus management on open
  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isOpen]);

  // Unlock Step 2: once name has at least 2 characters
  useEffect(() => {
    if (name.trim().length >= 2 && !step2Unlocked) {
      setStep2Unlocked(true);
    }
  }, [name, step2Unlocked]);

  // Unlock Step 3: once contact info has at least 3 characters
  useEffect(() => {
    if (contact.trim().length >= 3 && !step3Unlocked) {
      setStep3Unlocked(true);
    }
  }, [contact, step3Unlocked]);

  // Unlock Step 4 (Tags + Send button): once user starts typing message
  useEffect(() => {
    if (message.trim().length >= 1 && !step4Unlocked) {
      setStep4Unlocked(true);
    }
  }, [message, step4Unlocked]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contact.trim() || !message.trim()) {
      setErrorMessage("Iltimos, barcha maydonlarni to'ldiring.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contact: contact.trim(),
          service:
            selectedTags.length > 0 ? selectedTags.join(", ") : "General inquiry",
          message: message.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(
          data.error || "Xatolik yuz berdi. Iltimos qaytadan urinib ko'ring."
        );
      }
    } catch {
      setStatus("error");
      setErrorMessage(
        "Server bilan aloqa uzildi. Iltimos qaytadan urinib ko'ring."
      );
    }
  };

  const handleReset = () => {
    setName("");
    setContact("");
    setMessage("");
    setSelectedTags([]);
    setStep2Unlocked(false);
    setStep3Unlocked(false);
    setStep4Unlocked(false);
    setStatus("idle");
    setErrorMessage("");
    setIsOpen(true);
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  };

  return (
    <>
      <div className="revealer"></div>
      <main className="contact-page">
        <div className="contact-backdrop"></div>

        {/* 1. O'RTADA "RAHMAT" VA TAGIDAN PROGRESSIVE SUHBAT */}
        <div className="contact-center-container">
          <h1 className="contact-rahmat-title">Rahmat</h1>

          {/* Faqat textli "Gaplashamizmi?" tugmasi */}
          {!isOpen && (
            <button
              type="button"
              className="talk-text-trigger"
              onClick={() => setIsOpen(true)}
            >
              <span>Gaplashamizmi?</span>
              <span className="trigger-arrow">↗</span>
            </button>
          )}

          {/* Forma ochilganda sekin animatsiya bilan bosqichma-bosqich chiqish */}
          {isOpen && status !== "success" && (
            <form onSubmit={handleSubmit} className="progressive-form">
              {/* BOSQICH 1: Ismingiz */}
              <div className="progressive-field step-appear">
                <input
                  ref={nameInputRef}
                  id="contact-name"
                  type="text"
                  required
                  placeholder="Ismingiz..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="prog-input"
                  autoComplete="name"
                  aria-label="Ismingiz"
                />
              </div>

              {/* BOSQICH 2: Siz bilan bog'lanish uchun ma'lumot */}
              {step2Unlocked && (
                <div className="progressive-field step-appear">
                  <input
                    ref={contactInputRef}
                    id="contact-info"
                    type="text"
                    required
                    placeholder="Siz bilan bog'lanish uchun ma'lumot (Telegram, email yoki telefon)..."
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    className="prog-input"
                    autoComplete="email"
                    aria-label="Siz bilan bog'lanish uchun ma'lumot"
                  />
                </div>
              )}

              {/* BOSQICH 3: Loyiha haqida textarea */}
              {step3Unlocked && (
                <div className="progressive-field step-appear">
                  <textarea
                    ref={messageInputRef}
                    id="contact-message"
                    required
                    rows={3}
                    placeholder="Loyiha haqida (g'oya, maqsad yoki savolingiz)..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="prog-textarea"
                    aria-label="Loyiha haqida"
                  />
                </div>
              )}

              {/* BOSQICH 4: Teglar va Jo'natish tugmasi */}
              {step4Unlocked && (
                <div className="progressive-field step-appear">
                  <div className="prog-tags-row">
                    {SERVICE_TAGS.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`prog-tag-pill ${isSelected ? "selected" : ""}`}
                        >
                          {isSelected && <span className="tag-check">✓</span>}
                          <span>{tag}</span>
                        </button>
                      );
                    })}
                  </div>

                  {errorMessage && (
                    <p className="prog-error-msg">{errorMessage}</p>
                  )}

                  <div className="prog-submit-row">
                    <button
                      type="submit"
                      disabled={status === "submitting"}
                      className="prog-send-btn"
                    >
                      <span>
                        {status === "submitting"
                          ? "Yuborilmoqda..."
                          : "Jo'natish"}
                      </span>
                      <span className="btn-arrow">→</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* Muvaffaqiyatli yuborilgandagi holat */}
          {isOpen && status === "success" && (
            <div className="prog-success-msg step-appear">
              <h3 className="prog-success-title">Rahmat, {name}!</h3>
              <p className="prog-success-sub">
                Xabaringiz yetib bordi. Tez orada siz bilan bog&apos;lanaman.
              </p>
              <button
                type="button"
                className="prog-reset-btn"
                onClick={handleReset}
              >
                Yana xabar yuborish
              </button>
            </div>
          )}
        </div>

        {/* 2. NAVBAR__BOTTOM GA MOSLANDIRILGAN O'NG PASTKI MALUMOTLAR BLOKI */}
        <footer className="contact-bottom-dock">
          {/* Boshlanish ma'lumotlari: Email va Telegram */}
          <div className="dock-contact-links">
            <a
              href="mailto:muhammad1obloqulov@gmail.com"
              className="dock-link"
            >
              muhammad1obloqulov@gmail.com
            </a>
            <span className="dock-bullet">•</span>
            <a
              href="https://t.me/obloqulo_v"
              target="_blank"
              rel="noopener noreferrer"
              className="dock-link"
            >
              Telegram: @obloqulo_v
            </a>
          </div>

          {/* Created by + Obloqulov logo */}
          <div className="dock-branding">
            <div className="dock-sep" aria-hidden="true" />
            <span className="dock-by">Created by</span>
            <a
              href="https://t.me/obloqulo_v"
              target="_blank"
              rel="noopener noreferrer"
              className="dock-logo"
              aria-label="obloqulov"
            >
              <svg
                width="96"
                height="18"
                viewBox="0 0 106 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.74183 4.3292C7.85419 4.3292 8.82375 4.48703 9.65051 4.80271C10.4923 5.10334 11.1913 5.51672 11.7475 6.04284C12.3187 6.56896 12.7471 7.18527 13.0327 7.89177C13.3183 8.59827 13.4611 9.35738 13.4611 10.1691C13.4611 10.9808 13.3183 11.7399 13.0327 12.4464C12.7471 13.1529 12.3187 13.7693 11.7475 14.2954C11.1913 14.8215 10.4923 15.2424 9.65051 15.5581C8.82375 15.8587 7.85419 16.009 6.74183 16.009C5.62946 16.009 4.65239 15.8587 3.8106 15.5581C2.96881 15.2424 2.26231 14.8215 1.69109 14.2954C1.13491 13.7693 0.714017 13.1529 0.42841 12.4464C0.142803 11.7399 0 10.9808 0 10.1691C0 9.35738 0.142803 8.59827 0.42841 7.89177C0.714017 7.18527 1.13491 6.56896 1.69109 6.04284C2.26231 5.51672 2.96881 5.10334 3.8106 4.80271C4.65239 4.48703 5.62946 4.3292 6.74183 4.3292ZM10.2818 13.7317C10.5825 13.431 10.7629 13.0628 10.823 12.6268C10.8982 12.1759 10.8681 11.6949 10.7328 11.1838C10.6126 10.6727 10.3946 10.1466 10.0789 9.60541C9.76325 9.06426 9.35738 8.54566 8.86133 8.04961C8.21496 7.40323 7.531 6.90718 6.80947 6.56144C6.08794 6.21571 5.4115 6.04284 4.78016 6.04284C4.10372 6.04284 3.57009 6.23826 3.17926 6.62909C2.89365 6.91469 2.71327 7.28298 2.63811 7.73393C2.56295 8.16986 2.58549 8.64337 2.70575 9.15445C2.84104 9.66554 3.06652 10.1917 3.38219 10.7328C3.69786 11.274 4.10372 11.7926 4.59977 12.2886C5.26118 12.95 5.95265 13.4536 6.67418 13.7993C7.39572 14.1451 8.07215 14.3179 8.70349 14.3179C9.3649 14.3179 9.89102 14.1225 10.2818 13.7317Z"
                  fill="currentColor"
                />
                <path
                  d="M19.9963 4.55468C21.259 4.55468 22.3638 4.69748 23.3108 4.98309C24.2579 5.2687 25.047 5.66704 25.6784 6.17813C26.3097 6.68921 26.7757 7.29801 27.0763 8.00451C27.392 8.69598 27.5499 9.45509 27.5499 10.2818C27.5499 11.0485 27.3995 11.785 27.0989 12.4915C26.8133 13.183 26.3999 13.7918 25.8588 14.3179C25.3176 14.829 24.6562 15.2424 23.8745 15.5581C23.1079 15.8587 22.2361 16.009 21.259 16.009C20.312 16.009 19.5078 15.8812 18.8464 15.6257C18.1849 15.3702 17.6363 15.0545 17.2004 14.6787V15.7982L14.6975 15.7835V0H17.4935V4.55468H19.9963ZM22.8148 14.3179C23.4912 14.3179 24.0098 14.1375 24.3706 13.7768C24.7464 13.416 24.9418 12.95 24.9568 12.3788C24.9869 11.7926 24.8366 11.1387 24.5059 10.4171C24.1752 9.6956 23.6566 8.98159 22.9501 8.27508C22.2736 7.61368 21.4694 7.11763 20.5374 6.78692C19.6205 6.44119 18.6058 6.26832 17.4935 6.26832V7.37317C17.4935 8.22999 17.6137 9.07178 17.8542 9.89853C18.0948 10.7253 18.4405 11.4694 18.8915 12.1308C19.3574 12.7772 19.9211 13.3033 20.5825 13.7091C21.2439 14.115 21.988 14.3179 22.8148 14.3179Z"
                  fill="currentColor"
                />
                <path d="M28.7433 15.7835V0H31.5392V15.7835H28.7433Z" fill="currentColor" />
                <path
                  d="M39.5209 4.3292C40.6332 4.3292 41.6028 4.48703 42.4295 4.80271C43.2713 5.10334 43.9703 5.51672 44.5265 6.04284C45.0977 6.56896 45.5261 7.18527 45.8117 7.89177C46.0973 8.59827 46.2401 9.35738 46.2401 10.1691C46.2401 10.9808 46.0973 11.7399 45.8117 12.4464C45.5261 13.1529 45.0977 13.7693 44.5265 14.2954C43.9703 14.8215 43.2713 15.2424 42.4295 15.5581C41.6028 15.8587 40.6332 16.009 39.5209 16.009C38.4085 16.009 37.4314 15.8587 36.5896 15.5581C35.7478 15.2424 35.0413 14.8215 34.4701 14.2954C33.9139 13.7693 33.493 13.1529 33.2074 12.4464C32.9218 11.7399 32.779 10.9808 32.779 10.1691C32.779 9.35738 32.9218 8.59827 33.2074 7.89177C33.493 7.18527 33.9139 6.56896 34.4701 6.04284C35.0413 5.51672 35.7478 5.10334 36.5896 4.80271C37.4314 4.48703 38.4085 4.3292 39.5209 4.3292ZM43.0609 13.7317C43.3615 13.431 43.5419 13.0628 43.602 12.6268C43.6772 12.1759 43.6471 11.6949 43.5118 11.1838C43.3916 10.6727 43.1736 10.1466 42.8579 9.60541C42.5423 9.06426 42.1364 8.54566 41.6404 8.04961C40.994 7.40323 40.31 6.90718 39.5885 6.56144C38.867 6.21571 38.1905 6.04284 37.5592 6.04284C36.8827 6.04284 36.3491 6.23826 35.9583 6.62909C35.6727 6.91469 35.4923 7.28298 35.4171 7.73393C35.342 8.16986 35.3645 8.64337 35.4848 9.15445C35.6201 9.66554 35.8455 10.1917 36.1612 10.7328C36.4769 11.274 36.8827 11.7926 37.3788 12.2886C38.0402 12.95 38.7317 13.4536 39.4532 13.7993C40.1747 14.1451 40.8512 14.3179 41.4825 14.3179C42.1439 14.3179 42.67 14.1225 43.0609 13.7317Z"
                  fill="currentColor"
                />
                <path
                  d="M59.7426 4.55468V20H56.9241V15.7835H54.4439C53.1812 15.7835 52.0763 15.6407 51.1293 15.3551C50.1823 15.0695 49.3931 14.6712 48.7618 14.1601C48.1305 13.649 47.657 13.0477 47.3413 12.3563C47.0406 11.6498 46.8903 10.8831 46.8903 10.0564C46.8903 9.28974 47.0331 8.56069 47.3187 7.86922C47.6194 7.16272 48.0403 6.55393 48.5814 6.04284C49.1226 5.51672 49.7765 5.10334 50.5431 4.80271C51.3247 4.48703 52.2041 4.3292 53.1812 4.3292C54.1282 4.3292 54.9324 4.45697 55.5938 4.71251C56.2552 4.96806 56.8039 5.28373 57.2398 5.65953V4.55468H59.7426ZM56.9241 12.9876C56.9241 12.1308 56.8039 11.289 56.5634 10.4622C56.3229 9.62044 55.9696 8.87636 55.5036 8.22999C55.0527 7.56858 54.4965 7.04247 53.8351 6.65163C53.1887 6.24577 52.4521 6.04284 51.6254 6.04284C50.9489 6.04284 50.4228 6.22322 50.047 6.58399C49.6863 6.94476 49.4908 7.41826 49.4608 8.00451C49.4458 8.57572 49.6036 9.2221 49.9343 9.94363C50.265 10.6501 50.7836 11.3566 51.4901 12.0631C52.1665 12.7396 52.9632 13.2507 53.8802 13.5964C54.8122 13.9271 55.8268 14.0924 56.9241 14.0924V12.9876Z"
                  fill="currentColor"
                />
                <path
                  d="M72.9316 4.55468V15.7835H70.1131V12.9425C69.5569 13.9947 68.8354 14.7689 67.9485 15.2649C67.0766 15.761 66.1973 16.009 65.3104 16.009C64.7993 16.009 64.3032 15.9339 63.8222 15.7835C63.3562 15.6182 62.9428 15.3852 62.5821 15.0846C62.2213 14.7689 61.9357 14.3931 61.7253 13.9572C61.5148 13.5062 61.4096 12.9951 61.4096 12.4239V4.55468H64.2055V11.4769C64.2055 12.1233 64.431 12.6193 64.882 12.9651C65.3329 13.3108 65.8666 13.4837 66.4829 13.4837C66.9038 13.4837 67.3247 13.401 67.7456 13.2356C68.1815 13.0552 68.5723 12.7772 68.918 12.4014C69.2788 12.0256 69.5644 11.552 69.7749 10.9808C70.0003 10.3946 70.1131 9.6956 70.1131 8.88388V4.55468H72.9316Z"
                  fill="currentColor"
                />
                <path d="M74.7093 15.7835V0H77.5053V15.7835H74.7093Z" fill="currentColor" />
                <path
                  d="M85.4869 4.3292C86.5993 4.3292 87.5688 4.48703 88.3956 4.80271C89.2374 5.10334 89.9363 5.51672 90.4925 6.04284C91.0637 6.56896 91.4922 7.18527 91.7778 7.89177C92.0634 8.59827 92.2062 9.35738 92.2062 10.1691C92.2062 10.9808 92.0634 11.7399 91.7778 12.4464C91.4922 13.1529 91.0637 13.7693 90.4925 14.2954C89.9363 14.8215 89.2374 15.2424 88.3956 15.5581C87.5688 15.8587 86.5993 16.009 85.4869 16.009C84.3745 16.009 83.3974 15.8587 82.5557 15.5581C81.7139 15.2424 81.0074 14.8215 80.4362 14.2954C79.88 13.7693 79.4591 13.1529 79.1735 12.4464C78.8879 11.7399 78.7451 10.9808 78.7451 10.1691C78.7451 9.35738 78.8879 8.59827 79.1735 7.89177C79.4591 7.18527 79.88 6.56896 80.4362 6.04284C81.0074 5.51672 81.7139 5.10334 82.5557 4.80271C83.3974 4.48703 84.3745 4.3292 85.4869 4.3292ZM89.0269 13.7317C89.3276 13.431 89.5079 13.0628 89.5681 12.6268C89.6432 12.1759 89.6132 11.6949 89.4779 11.1838C89.3576 10.6727 89.1396 10.1466 88.824 9.60541C88.5083 9.06426 88.1024 8.54566 87.6064 8.04961C86.96 7.40323 86.2761 6.90718 85.5545 6.56144C84.833 6.21571 84.1566 6.04284 83.5252 6.04284C82.8488 6.04284 82.3152 6.23826 81.9243 6.62909C81.6387 6.91469 81.4583 7.28298 81.3832 7.73393C81.308 8.16986 81.3306 8.64337 81.4508 9.15445C81.5861 9.66554 81.8116 10.1917 82.1272 10.7328C82.4429 11.274 82.8488 11.7926 83.3448 12.2886C84.0062 12.95 84.6977 13.4536 85.4192 13.7993C86.1408 14.1451 86.8172 14.3179 87.4486 14.3179C88.11 14.3179 88.6361 14.1225 89.0269 13.7317Z"
                  fill="currentColor"
                />
                <path
                  d="M105.335 4.55468L100.037 15.7835H97.173L91.8743 4.55468H94.9859L98.6161 12.2435L102.224 4.55468H105.335Z"
                  fill="currentColor"
                />
                <path d="M0.556641 19.0716V16.7754H55.9869V19.0716H0.556641Z" fill="currentColor" />
                <path d="M60.6836 19.1345V16.8383L104.37 16.7754V19.0716L60.6836 19.1345Z" fill="currentColor" />
              </svg>
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
