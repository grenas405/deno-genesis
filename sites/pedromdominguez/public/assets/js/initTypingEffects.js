// File: /assets/js/initTypingEffects.js

import { typeLineByLine } from './typingengine.js';

// ✅ Export as a reusable async function
export async function initializeTypingEffects() {
  // Helper: clear text + hide initially
  function prepareTyping(el) {
    if (!el) return null;
    const text = el.textContent.trim();
    el.textContent = "";
    el.style.visibility = "visible";
    return text;
  }

  // Typing: Headline
  const headline = document.getElementById("hero-headline");
  if (headline) {
    const text = prepareTyping(headline);
    if (text) await typeLineByLine(text, headline, 50);
  }

  // Typing: Subheading
//  const subheading = document.querySelector(".hero-subheading");
//  if (subheading) {
//    const text = prepareTyping(subheading);
//    if (text) await typeLineByLine(text, subheading, 15);
//  }

  // Typing: Each Impact Box
//  const impactBoxes = document.querySelectorAll(".impact-box");
//  for (const box of impactBoxes) {
//    const h2 = box.querySelector("h2");
//    const p = box.querySelector("p");
//
//    if (h2) {
//      const textH2 = prepareTyping(h2);
//      if (textH2) await typeLineByLine(textH2, h2, 15);
//    }
//
//    if (p) {
//      const textP = prepareTyping(p);
//      if (textP) await typeLineByLine(textP, p, 15);
//    }
//  }

  // Typing: Mission Statement
  const mission = document.querySelector(".mission-statement");
  if (mission) {
    const text = prepareTyping(mission);
    if (text) await typeLineByLine(text, mission, 15);
  }

  // ✅ New: Login Heading & Subtext
  const loginTitle = document.querySelector(".login-title");
  if (loginTitle) {
    const text = prepareTyping(loginTitle);
    if (text) await typeLineByLine(text, loginTitle, 30);
  }

  const loginSubtext = document.querySelector(".login-subtext");
  if (loginSubtext) {
    const text = prepareTyping(loginSubtext);
    if (text) await typeLineByLine(text, loginSubtext, 15);
  }
}
