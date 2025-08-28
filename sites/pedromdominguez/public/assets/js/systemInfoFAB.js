// File: /assets/js/systemInfoFAB.js

export async function initializeSystemInfoFAB() {
  const fab = document.getElementById("system-info-fab");
  const panel = document.getElementById("system-info-panel");
  const list = document.getElementById("system-info-list");

  if (!fab || !panel || !list) return;

  // ✅ Load system info immediately
  try {
    const response = await fetch("/api/system/info");
    const data = await response.json();

    if (response.ok) {
      list.innerHTML = `
        <li><strong>Framework:</strong> ${data.framework}</li>
        <li><strong>Version:</strong> ${data.frameworkVersion}</li>
        <li><strong>Deno:</strong> ${data.denoVersion}</li>
        <li><strong>TypeScript:</strong> ${data.typescriptVersion}</li>
        <li><strong>V8:</strong> ${data.v8Version}</li>
        <li><strong>Kernel:</strong> ${data.kernelVersion}</li>
        <li><strong>Distro:</strong> ${data.linuxDistro}</li>
        <li><strong>Uptime:</strong> ${data.uptime} sec</li>
      `;
    } else {
      list.innerHTML = `<li>Error loading system info.</li>`;
    }
  } catch (err) {
    console.error(err);
    list.innerHTML = `<li>Error loading system info.</li>`;
  }

  // ✅ Toggle panel
  fab.addEventListener("click", () => {
    panel.classList.toggle("visible");
    panel.classList.toggle("hidden");
  });

  // ✅ Click outside to close
  document.addEventListener("click", (e) => {
    if (!panel.contains(e.target) && e.target !== fab && panel.classList.contains("visible")) {
      panel.classList.remove("visible");
      panel.classList.add("hidden");
    }
  });
}