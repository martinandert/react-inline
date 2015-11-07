import path   from 'path';
import fs     from 'fs';
import glob   from 'glob';
import mkdirp from 'mkdirp';

export function bundle(sourceDir, filename = 'bundle.css', options = {}) {
  const bundleFile = path.join(sourceDir, filename);

  const globOptions = { cwd: sourceDir, realpath: true, ignore: bundleFile };
  const globPattern = options.globPattern || '**/*.css';

  const readOptions   = { encoding: options.sourceCharset || 'utf8' };
  const writeOptions  = { encoding: options.outputCharset || 'utf8' };

  const cssFiles = glob.sync(globPattern, globOptions);

  const bundleCSS = cssFiles.reduce((memo, filePath) => {
    return memo + fs.readFileSync(filePath, readOptions);
  }, '');

  mkdirp.sync(path.dirname(bundleFile));
  fs.writeFileSync(bundleFile, bundleCSS, writeOptions);
}

export default { bundle };
