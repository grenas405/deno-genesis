// matrixRain.js → v2.0 → Fullscreen Matrix Canvas

export function startMatrixRain(canvasId = 'matrix-rain') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Resize to full screen
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const katakana = "アァイィウエオカキクケコサシスセソタチツテトナニヌネノABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const fontSize = 26;
  const columns = Math.floor(canvas.width / fontSize);

  const drops = Array(columns).fill(1);

  function drawMatrix() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#33ff99";
    ctx.font = `${fontSize}px 'Fira Code', monospace`;

    for (let i = 0; i < drops.length; i++) {
      const char = katakana[Math.floor(Math.random() * katakana.length)];
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);

      // Reset drop randomly
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.95) {
        drops[i] = 0;
      }

      drops[i]++;
    }
  }

  setInterval(drawMatrix, 40);
}
