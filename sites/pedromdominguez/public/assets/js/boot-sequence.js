 // File: /assets/js/boot-sequence.js

import { asciiLogo } from './asciiLogo.js';
import { loadBootScreen } from './load-components.js';
import { typeLineByLine } from './typingengine.js';
import { startMatrixRain } from './matrixRain.js';

const CLIENT_NAME = window.CLIENT_NAME ?? "Pedro M. Dominguez Portfolio";
const FRAMEWORK_VERSION = "DenoGenesis v1.6.0";

// 🖥️ System Diagnostics
const systemInfo = [
  '[ <span class="ok">OK</span> ] <span class="module">Meta Framework Runtime</span>: <span class="module">Deno + TypeScript</span>',
  '[ <span class="ok">OK</span> ] Core Architecture: <span class="module">Sovereign-First, Local-First</span>',
  `[ <span class="ok">OK</span> ] Meta Framework: <span class="module">${FRAMEWORK_VERSION}</span>`,
  `[ <span class="ok">OK</span> ] Portfolio Client: <span class="module">${CLIENT_NAME}</span>`,
  '[ <span class="ok">OK</span> ] Infrastructure: <span class="module">Debian Hardened</span>',
];

// 🧭 Founder Identity & Mission
const missionInfo = [
  '[ <span class="ok">OK</span> ] Founder: <span class="module">Pedro M. Dominguez</span>',
  '[ <span class="ok">OK</span> ] Birthplace: <span class="module">Ciudad Juárez, México 🇲🇽</span>',
  '[ <span class="ok">OK</span> ] Home Base: <span class="module">Oklahoma City, Oklahoma</span>',
  '[ <span class="ok">OK</span> ] Mission: <span class="module">Empowering businesses with transparent, sovereign-first systems</span>',
  '[ <span class="ok">OK</span> ] Specialization: <span class="module">Meta Framework Design & Automation</span>',
  '<span class="success">✅ DenoGenesis Boot Complete — Access Granted</span>',
];

// ✅ Final Signature
const finalLine = `
<span class="ok flicker">✨ Sovereign Tech Begins Here — Powered by DenoGenesis ✨</span>
`;

// 📊 Progress Helper
function updateProgressBar(percent) {
  const bar = document.getElementById('boot-progress-fill');
  if (bar) bar.style.width = `${percent}%`;
}

// 🚀 Run Boot Sequence
export async function runBootSequence() {
  if (sessionStorage.getItem('bootShown') === 'true') {
    document.getElementById('main-app')?.style.setProperty('display', 'block');
    return;
  }

  document.body.classList.add('boot-active');
  await loadBootScreen();
  await new Promise(requestAnimationFrame);

  startMatrixRain('matrix-rain', {
    fontSize: 18,
    speed: 28,
    tailGlow: 0.1,
  });

  const output = document.getElementById('boot-output');
  if (!output) return console.error("❌ #boot-output not found.");

  let step = 0;
  const totalSteps = asciiLogo.length + systemInfo.length + missionInfo.length + 6;

  // 🧬 ASCII Logo with flicker effect
  for (const line of asciiLogo) {
    await typeLineByLine(line, output, 5);
    if (Math.random() < 0.2) output.lastChild.classList.add('flicker');
    updateProgressBar(++step / totalSteps * 100);
  }

  await new Promise(r => setTimeout(r, 500));

  await typeLineByLine('<span class="section-title">🖥️ SYSTEM CHECKS:</span>', output, 25);
  updateProgressBar(++step / totalSteps * 100);

  await typeLineByLine('<span class="flicker">[ VERIFYING META FRAMEWORK MODULES... ]</span>', output, 30);
  await new Promise(r => setTimeout(r, 350));
  updateProgressBar(++step / totalSteps * 100);

  for (const log of systemInfo) {
    await typeLineByLine(log, output, 25);
    updateProgressBar(++step / totalSteps * 100);
  }

  await new Promise(r => setTimeout(r, 400));

  await typeLineByLine('<span class="section-title">📡 FOUNDER IDENTITY:</span>', output, 25);
  updateProgressBar(++step / totalSteps * 100);

  await typeLineByLine('<span class="flicker">[ LOADING MISSION PARAMETERS... ]</span>', output, 30);
  await new Promise(r => setTimeout(r, 350));
  updateProgressBar(++step / totalSteps * 100);

  for (const log of missionInfo) {
    await typeLineByLine(log, output, 25);
    updateProgressBar(++step / totalSteps * 100);
  }

  await new Promise(r => setTimeout(r, 800));

  output.style.transition = 'opacity 0.5s ease-out';
  output.style.opacity = '0';
  await new Promise(r => setTimeout(r, 600));
  output.innerHTML = '';
  output.style.opacity = '1';

  await typeLineByLine(finalLine, output, 40);
  updateProgressBar(100);

  await new Promise(r => setTimeout(r, 1000));

  const matrixRain = document.getElementById('matrix-rain');
  if (matrixRain) {
    matrixRain.style.transition = 'opacity 1s ease-in-out';
    matrixRain.style.opacity = '0';
  }

  sessionStorage.setItem('bootShown', 'true');

  const bootScreen = document.getElementById('boot-screen');
  bootScreen?.classList.add('hide');

  setTimeout(() => {
    bootScreen?.remove();
    document.body.classList.remove('boot-active');
    document.getElementById('main-app')?.style.setProperty('display', 'block');
  }, 600);
}