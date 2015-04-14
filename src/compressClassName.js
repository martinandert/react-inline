/*
 * @providesModule compressClassName
 */

import DiskCache    from 'DiskCache';
import MemoryCache  from 'MemoryCache';

const cacheName = 'classnames';

function getCache(options) {
  if (options.cacheDir) {
    return new DiskCache(cacheName, options);
  } else {
    return new MemoryCache(cacheName);
  }
}

function clearCache(options) {
  getCache(options).clear();
}

export default function compressClassName(className, options) {
  let cache = getCache(options);

  return cache.fetch(className, function(keys) {
    return '_' + keys.length.toString(36).split('').reverse().join('');
  });
}

compressClassName.clearCache = clearCache;
