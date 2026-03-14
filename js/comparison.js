/**
 * comparison.js — FirstCape Estate Management
 * Stores up to 3 property IDs in localStorage for side-by-side comparison.
 * Exposes: window.comparison.toggle(), has(), getAll(), remove(), clearAll(), count()
 * Auto-updates all .comparison-counter badges on the page.
 */
(function() {
  var STORAGE_KEY = 'firstcape_comparison';
  var MAX = 3;

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch(e) {
      return [];
    }
  }

  function save(ids) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch(e) {}
    updateCounters();
  }

  function updateCounters() {
    var count = load().length;
    document.querySelectorAll('.comparison-counter').forEach(function(el) {
      el.textContent = count;
      el.style.display = count > 0 ? '' : 'none';
    });
  }

  window.comparison = {
    getAll:  function() { return load(); },
    count:   function() { return load().length; },
    has:     function(id) { return load().indexOf(id) !== -1; },

    add: function(id) {
      var ids = load();
      if (ids.indexOf(id) !== -1) return true;
      if (ids.length >= MAX) return false; // full
      ids.push(id);
      save(ids);
      return true;
    },

    remove: function(id) {
      save(load().filter(function(i) { return i !== id; }));
    },

    toggle: function(id) {
      if (window.comparison.has(id)) {
        window.comparison.remove(id);
        return false;
      } else {
        return window.comparison.add(id);
      }
    },

    clearAll: function() { save([]); }
  };

  document.addEventListener('DOMContentLoaded', updateCounters);
})();
