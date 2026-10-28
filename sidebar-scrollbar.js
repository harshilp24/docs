// Show the sidebar scrollbar only while the sidebar is being scrolled.
// Adds .neo-is-scrolling to the scrolling element and removes it shortly after scrolling stops.
(function () {
  var timers = new WeakMap();

  document.addEventListener(
    'scroll',
    function (event) {
      var el = event.target;
      if (!(el instanceof Element)) return;
      var inSidebar =
        el.id === 'sidebar-content' ||
        el.id === 'sidebar' ||
        el.closest('#sidebar') ||
        el.querySelector(':scope > #sidebar, :scope > #sidebar-content');
      if (!inSidebar) return;

      el.classList.add('neo-is-scrolling');
      clearTimeout(timers.get(el));
      timers.set(
        el,
        setTimeout(function () {
          el.classList.remove('neo-is-scrolling');
        }, 800)
      );
    },
    true
  );
})();
