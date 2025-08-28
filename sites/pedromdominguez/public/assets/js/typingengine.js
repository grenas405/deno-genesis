// typingengine.js → v2.2 → HTML-safe terminal typing + Anime.js

import anime from "https://cdn.jsdelivr.net/npm/animejs@3.2.1/lib/anime.es.js";

/**
 * Types a line into a target element with HTML-safe rendering.
 * Supports spans and other inline HTML elements.
 * @param {string} line - Text or HTML to render
 * @param {HTMLElement} target - Output container
 * @param {number} delay - Delay per character (default: 40ms)
 */
export async function typeLineByLine(line, target, delay = 40) {
  return new Promise(resolve => {
    const temp = document.createElement("div");
    temp.innerHTML = line;

    const fragments = Array.from(temp.childNodes);
    const spanElements = [];

    for (const node of fragments) {
      if (node.nodeType === Node.TEXT_NODE) {
        for (const char of node.textContent) {
          const span = document.createElement("span");
          span.textContent = char;
          span.style.opacity = "0";
          target.appendChild(span);
          spanElements.push(span);
        }
      } else {
        const clone = node.cloneNode(true);
        clone.style.opacity = "0";
        target.appendChild(clone);
        spanElements.push(clone);
      }
    }

    anime.timeline({
      easing: "linear",
      complete: () => {
        target.appendChild(document.createElement("br"));
        resolve();
      }
    }).add({
      targets: spanElements,
      opacity: [0, 1],
      duration: 1,
      delay: anime.stagger(delay),
    });
  });
}

/**
 * Clears terminal output
 * @param {HTMLElement} target
 */
export function clearTerminal(target) {
  target.textContent = "";
}