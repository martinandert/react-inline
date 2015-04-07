/*
 * @providesModule MemoryCache
 */

const hasOwnProperty = Object.prototype.hasOwnProperty;

let cache = {};

class MemoryCache {
  constructor(name) {
    this.name = name;

    this.fetch.bind(this);
    this.clear.bind(this);

    cache[name] = cache[name] || {};
  }

  fetch(key, miss) {
    if (hasOwnProperty.call(cache[this.name], key)) {
      return cache[this.name][key];
    }

    cache[this.name][key] = miss(Object.keys(cache[this.name]));
    return cache[this.name][key];
  }

  clear() {
    cache[this.name] = {};
  }
}

export default MemoryCache;
