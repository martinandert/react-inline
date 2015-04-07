/*
 * @providesModule objEach
 */

const hasOwnProperty = Object.prototype.hasOwnProperty;

export default function objEach(obj, callback) {
  for (let key in obj) {
    if (hasOwnProperty.call(obj, key)) {
      callback(key, obj[key]);
    }
  }
}
