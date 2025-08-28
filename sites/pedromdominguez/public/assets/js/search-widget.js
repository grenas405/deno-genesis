export function initializeFloatingSearch() {
  const fab = document.getElementById("search-fab");
  const form = document.getElementById("floating-search-form");
  const input = document.getElementById("floating-search-input");

  if (!fab || !form || !input) {
    console.warn("Floating search: required elements missing");
    return;
  }

  // Toggle form when FAB is clicked
  fab.addEventListener("click", () => {
    form.classList.toggle("visually-hidden");
    if (!form.classList.contains("visually-hidden")) {
      input.focus();
    }
  });

  // Submit handler: redirect to search page with query param
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (query.length === 0) {
      console.warn("Floating search: empty query");
      return;
    }

    // Redirect to your new search.html with the query param
    window.location.href = `/pages/search/search.html?q=${encodeURIComponent(query)}`;
  });

  // Auto-hide if clicking outside
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!form.contains(target) && !fab.contains(target)) {
      form.classList.add("visually-hidden");
    }
  });

  // Optional: handle Escape key to close the form
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      form.classList.add("visually-hidden");
    }
  });
}
