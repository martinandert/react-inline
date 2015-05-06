import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';

const hasOwnProperty = Object.prototype.hasOwnProperty;

function remove(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

function load(filePath) {
  if (!fs.existsSync(filePath)) {
    mkdirp.sync(path.dirname(filePath));
    store({}, filePath);
    return {};
  }

  const data = fs.readFileSync(filePath, { encoding: 'utf8' });

  return JSON.parse(data);
}

function store(data, filePath) {
  fs.writeFileSync(filePath, JSON.stringify(data));
}

class DiskCache {
  constructor(name, options) {
    this.filePath = path.resolve(path.join(options.cacheDir, name + '.json'));

    this.fetch.bind(this);
    this.clear.bind(this);
  }

  fetch(key, miss) {
    const cache = load(this.filePath);

    if (hasOwnProperty.call(cache, key)) {
      return cache[key];
    }

    cache[key] = miss(Object.keys(cache));

    store(cache, this.filePath);

    return cache[key];
  }

  clear() {
    remove(this.filePath);
  }
}

export default DiskCache;
