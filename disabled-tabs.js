/* Disabled tabs: grey out tabs that are not ready yet and block clicks on them.
   Applies to Tasket and Friday (every page outside /studio/).
   Edit DISABLED_TABS to change which tabs are disabled.
   The "We're putting this together. Check back soon." hover tooltip is pure CSS (see "Disabled tabs" in style.css). */
(function () {
  var DISABLED_TABS = ['Admin Guide', 'Developer Guide', 'API Reference', 'MCP Reference'];
  var TAB_SELECTOR = '.nav-tabs-item, .mobile-nav-tabs-item, mobile-nav-tabs-item';

  function isTasketOrFriday() {
    var path = document.documentElement.getAttribute('data-current-path') || location.pathname;
    return path.indexOf('/studio/') !== 0;
  }

  function isDisabled(el) {
    return isTasketOrFriday() && DISABLED_TABS.indexOf((el.textContent || '').trim()) !== -1;
  }

  function apply() {
    document.querySelectorAll(TAB_SELECTOR).forEach(function (tab) {
      var disabled = isDisabled(tab);
      tab.classList.toggle('neo-tab-disabled', disabled);
      if (disabled) {
        tab.setAttribute('aria-disabled', 'true');
        tab.setAttribute('aria-label', (tab.textContent || '').trim() + ': we\u2019re putting this together. Check back soon.');
        tab.setAttribute('tabindex', '-1');
        // No native title tooltip, so only the styled CSS tooltip shows
        tab.removeAttribute('title');
      } else if (tab.getAttribute('aria-disabled') === 'true') {
        tab.removeAttribute('aria-disabled');
        tab.removeAttribute('aria-label');
        tab.removeAttribute('tabindex');
      }
    });
    // Remove the tooltip element left over from the previous script version, if any
    var oldTip = document.getElementById('neo-tab-tooltip');
    if (oldTip) oldTip.remove();
  }

  document.addEventListener(
    'click',
    function (event) {
      var tab = event.target.closest && event.target.closest(TAB_SELECTOR);
      if (!tab || !isDisabled(tab)) return;
      event.preventDefault();
      event.stopPropagation();
    },
    true
  );

  apply();
  window.addEventListener('mintlify:navigate', function () {
    requestAnimationFrame(apply);
  });
})();
