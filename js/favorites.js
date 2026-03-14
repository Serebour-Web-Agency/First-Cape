/**
 * favorites.js — FirstCape Estate Management
 * Stores saved property IDs in localStorage.
 * Exposes: favorites.add(), remove(), toggle(), has(), getAll(), clearAll(), count()
 * Auto-updates all .favorites-counter badges on the page.
 */
(function() {
  var STORAGE_KEY = 'firstcape_favorites';

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
    document.querySelectorAll('.favorites-counter').forEach(function(el) {
      el.textContent = count;
      el.style.display = count > 0 ? '' : 'none';
    });
  }

  window.favorites = {
    getAll: function() { return load(); },
    count: function() { return load().length; },
    has: function(id) { return load().indexOf(id) !== -1; },

    add: function(id) {
      var ids = load();
      if (ids.indexOf(id) === -1) { ids.push(id); save(ids); }
    },

    remove: function(id) {
      var ids = load().filter(function(i) { return i !== id; });
      save(ids);
    },

    toggle: function(id) {
      if (window.favorites.has(id)) {
        window.favorites.remove(id);
        return false; // removed
      } else {
        window.favorites.add(id);
        return true; // added
      }
    },

    clearAll: function() {
      save([]);
    }
  };

  // Update counters on load
  document.addEventListener('DOMContentLoaded', updateCounters);

})();
