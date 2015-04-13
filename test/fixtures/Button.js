import React from 'react';
import StyleSheet from 'react-inline';
import cx from 'classnames';

class Button extends React.Component {
  render() {
    return (
      <button style={styles.generic}>Click Me</button>
    );
  }
}

const styles = StyleSheet.create({
  generic: {
    border: 'solid 1px #ccc'
  }
});

export default Button;
