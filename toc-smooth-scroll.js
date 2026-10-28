/* Smooth scroll for "On this page" (table of contents) links and in-page anchors.
   On desktop the page content scrolls inside the #content-area card, so we
   scroll that container; otherwise we scroll the window. */
(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function scrollerFor(el) {
    var area = document.getElementById('content-area');
    if (area && area.contains(el) && area.scrollHeight > area.clientHeight + 1) {
      var oy = getComputedStyle(area).overflowY;
      if (oy === 'auto' || oy === 'scroll') return area;
    }
    return null;
  }

  function smoothScrollTo(target) {
    var scroller = scrollerFor(target);
    var behavior = reduceMotion ? 'auto' : 'smooth';
    var gap = 16;

    if (scroller) {
      var top = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - gap;
      scroller.scrollTo({ top: Math.max(top, 0), behavior: behavior });
    } else {
      var header = document.getElementById('navbar');
      var offset = (header ? header.getBoundingClientRect().height : 0) + gap;
      var y = target.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: Math.max(y, 0), behavior: behavior });
    }
  }

  document.addEventListener(
    'click',
    function (event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var link = event.target.closest && event.target.closest('a[href*="#"]');
      if (!link) return;

      var url;
      try {
        url = new URL(link.getAttribute('href'), location.href);
      } catch (e) {
        return;
      }
      if (url.pathname !== location.pathname || !url.hash) return;

      var id = decodeURIComponent(url.hash.slice(1));
      var target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      event.stopPropagation();
      smoothScrollTo(target);
      if (location.hash !== url.hash) history.pushState(null, '', url.hash);
    },
    true
  );
})();
