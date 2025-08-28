// techStackSlider.js → v1.1 → Seamless infinite scroll with Anime.js
import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.1/lib/anime.es.js";

export function initializeTechStackSlider() {
  const track = document.querySelector(".logo-track");

  if (track) {
    // ✅ 1️⃣ Duplicate all logos inside the same track for seamless loop
    const logos = Array.from(track.children);
    logos.forEach(logo => {
      const clone = logo.cloneNode(true);
      track.appendChild(clone);
    });

    // ✅ 2️⃣ Animate with Anime.js for infinite left scroll
    anime({
      targets: ".logo-track",
      translateX: ["0%", "-50%"],
      easing: "linear",
      duration: 20000, // adjust for speed
      loop: true
    });
  }
}