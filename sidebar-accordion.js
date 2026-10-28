/* Sidebar accordion: click a sidebar group header (Organize, Manage, Report, ...)
   to collapse or expand its pages. Every group is expanded by default.
   Collapsed groups are remembered for the browser session, per product.

   Animation (Web Animations API, so theme CSS transitions can't interfere):
   - the group's height eases between its content height and 0, so the
     sections below glide up/down instead of jumping;
   - each sub item fades and slides in (staggered) on expand, and fades out
     on collapse. */
(function () {
  var STORAGE_KEY = 'neo-sidebar-collapsed';
  var DURATION = 300;
  var EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';
  var STAGGER = 25;

  function reduceMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function load() {
    try {
      return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function save(state) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function productKey() {
    var path = document.documentElement.getAttribute('data-current-path') || location.pathname;
    if (path.indexOf('/studio/') === 0) return 'studio';
    if (path.indexOf('/friday/') === 0) return 'friday';
    return 'tasket';
  }

  function keyFor(header) {
    return productKey() + ':' + (header.textContent || '').trim();
  }

  function groupFor(header) {
    var next = header.nextElementSibling;
    if (next && next.classList.contains('sidebar-group')) return next;
    var parent = header.parentElement;
    return parent ? parent.querySelector(':scope > .sidebar-group, :scope > ul') : null;
  }

  function itemsOf(group) {
    var items = group.querySelectorAll(':scope > li');
    return items.length ? Array.prototype.slice.call(items) : Array.prototype.slice.call(group.children);
  }

  function stopAnimations(group) {
    (group._neoAnims || []).forEach(function (a) {
      a.cancel();
    });
    group._neoAnims = [];
  }

  function animateGroup(group, collapsed) {
    // Current visual height (mid-animation safe).
    var from = group.getBoundingClientRect().height;
    stopAnimations(group);

    var items = itemsOf(group);
    var anims = [];
    var to;

    if (collapsed) {
      to = 0;
      anims.push(
        group.animate(
          [
            { height: from + 'px', opacity: 1, overflow: 'hidden', visibility: 'visible' },
            { height: '0px', opacity: 0, overflow: 'hidden', visibility: 'visible',
              marginTop: '0px', marginBottom: '0px', paddingTop: '0px', paddingBottom: '0px' }
          ],
          { duration: DURATION, easing: EASE }
        )
      );
      items.forEach(function (item) {
        anims.push(
          item.animate(
            [
              { opacity: 1, transform: 'translateY(0)' },
              { opacity: 0, transform: 'translateY(-4px)' }
            ],
            { duration: DURATION * 0.6, easing: 'ease-in', fill: 'forwards' }
          )
        );
      });
      group.classList.add('neo-group-collapsed');
    } else {
      group.classList.remove('neo-group-collapsed');
      to = group.getBoundingClientRect().height;
      var target = getComputedStyle(group);
      anims.push(
        group.animate(
          [
            { height: from + 'px', overflow: 'hidden',
              marginTop: from ? target.marginTop : '0px', marginBottom: from ? target.marginBottom : '0px',
              paddingTop: from ? target.paddingTop : '0px', paddingBottom: from ? target.paddingBottom : '0px' },
            { height: to + 'px', overflow: 'hidden',
              marginTop: target.marginTop, marginBottom: target.marginBottom,
              paddingTop: target.paddingTop, paddingBottom: target.paddingBottom }
          ],
          { duration: DURATION, easing: EASE }
        )
      );
      items.forEach(function (item, i) {
        anims.push(
          item.animate(
            [
              { opacity: 0, transform: 'translateY(-6px)' },
              { opacity: 1, transform: 'translateY(0)' }
            ],
            { duration: DURATION, delay: Math.min(i * STAGGER, 200), easing: EASE, fill: 'backwards' }
          )
        );
      });
    }

    group._neoAnims = anims;
    // Clean up once every animation (incl. staggered items) has finished.
    Promise.all(anims.map(function (a) { return a.finished; }))
      .then(function () {
        if (group._neoAnims === anims) stopAnimations(group);
      })
      .catch(function () {});
  }

  function setCollapsed(header, collapsed, animate) {
    var group = groupFor(header);
    header.classList.toggle('neo-collapsed', collapsed);
    header.setAttribute('aria-expanded', String(!collapsed));
    if (!group) return;
    var isCollapsed = group.classList.contains('neo-group-collapsed');
    if (animate && !reduceMotion() && typeof group.animate === 'function' && isCollapsed !== collapsed) {
      animateGroup(group, collapsed);
    } else {
      group.classList.toggle('neo-group-collapsed', collapsed);
    }
  }

  function apply() {
    var state = load();
    document.querySelectorAll('#sidebar .sidebar-group-header').forEach(function (header) {
      header.setAttribute('role', 'button');
      header.setAttribute('tabindex', '0');
      setCollapsed(header, !!state[keyFor(header)], false);
    });
  }

  function toggle(header) {
    var state = load();
    var key = keyFor(header);
    var collapsed = !header.classList.contains('neo-collapsed');
    if (collapsed) state[key] = true;
    else delete state[key];
    save(state);
    setCollapsed(header, collapsed, true);
  }

  document.addEventListener('click', function (event) {
    var header = event.target.closest && event.target.closest('#sidebar .sidebar-group-header');
    if (!header) return;
    event.preventDefault();
    toggle(header);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    var header = event.target.closest && event.target.closest('#sidebar .sidebar-group-header');
    if (!header) return;
    event.preventDefault();
    toggle(header);
  });

  apply();
  window.addEventListener('mintlify:navigate', function () {
    requestAnimationFrame(apply);
  });
})();
