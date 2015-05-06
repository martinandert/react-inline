export default function splitSelector(name) {
  const indexOfColon = name.indexOf(':');
  const indexOfBracket = name.indexOf('[');

  if (indexOfColon < 0 && indexOfBracket < 0) {
    return [name, ''];
  }

  let splitIndex;

  if (indexOfColon < 0) {
    splitIndex = indexOfBracket;
  } else if (indexOfBracket < 0) {
    splitIndex = indexOfColon;
  } else {
    splitIndex = Math.min(indexOfBracket, indexOfColon);
  }

  return [name.substr(0, splitIndex), name.substr(splitIndex)];
}
