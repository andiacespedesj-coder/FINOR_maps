(function () {
  "use strict";

  const icons = {
    DoorOpen: '<path d="M4 21V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v17"/><path d="M4 21h16"/><path d="M14 12h.01"/>',
    FlaskConical: '<path d="M10 2v7.3L4.8 18a2.5 2.5 0 0 0 2.1 4h10.2a2.5 2.5 0 0 0 2.1-4L14 9.3V2"/><path d="M8 2h8"/><path d="M8 15h8"/>',
    Library: '<path d="M4 20V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16"/><path d="M8 2v18"/><path d="M16 2v18"/><path d="M4 10h16"/>',
    Droplets: '<path d="M12 2s7 7.1 7 12a7 7 0 0 1-14 0c0-4.9 7-12 7-12Z"/><path d="M8.5 15.5a4 4 0 0 0 3 2"/>',
    Utensils: '<path d="M4 3v8"/><path d="M8 3v8"/><path d="M4 7h4"/><path d="M6 11v10"/><path d="M14 3v18"/><path d="M14 3c4 0 6 3 6 6v2h-6"/>',
    Briefcase: '<rect width="16" height="11" x="4" y="8" rx="2"/><path d="M8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3"/><path d="M4 13h16"/><path d="M10 13v2h4v-2"/>',
    GraduationCap: '<path d="m2 10 10-5 10 5-10 5-10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/><path d="M22 10v6"/>',
    Building2: '<path d="M3 21h18"/><path d="M6 21V3h12v18"/><path d="M9 6h1M14 6h1M9 10h1M14 10h1M9 14h1M14 14h1"/>',
    Trophy: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H3v1a5 5 0 0 0 4 4"/><path d="M17 6h4v1a5 5 0 0 1-4 4"/>',
    HeartPulse: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.9-8.6a5.5 5.5 0 0 0-.1-7.8Z"/><path d="M3.5 12h4l1.5-3 2 6 1.5-3h4"/>',
    CreditCard: '<rect width="18" height="12" x="3" y="6" rx="2"/><path d="M3 10h18"/><path d="M7 15h2"/>',
    Mic: '<rect width="8" height="13" x="8" y="2" rx="4"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><path d="M12 18v4"/><path d="M8 22h8"/>',
    Book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>',
    Info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    MoreHorizontal: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'
  };

  function svgFor(name) {
    const paths = icons[name] || icons.MoreHorizontal;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
  }

  function addIconGrid() {
    const inputs = document.querySelectorAll("input.category-icon-choice");
    if (!inputs.length) return;

    const refresh = function () {
      inputs.forEach(function (input) {
        const label = input.closest("label");
        if (label) label.classList.toggle("is-selected", input.checked);
      });
    };

    inputs.forEach(function (input) {
      const label = input.closest("label");
      if (!label || label.dataset.iconReady) return;
      label.dataset.iconReady = "true";
      label.classList.add("category-icon-tile");
      const visual = document.createElement("span");
      visual.className = "category-icon-visual";
      visual.innerHTML = svgFor(input.value);
      label.insertBefore(visual, label.firstChild);
      input.addEventListener("change", refresh);
    });
    refresh();
  }

  document.addEventListener("DOMContentLoaded", function () {
    addIconGrid();
  });
}());
