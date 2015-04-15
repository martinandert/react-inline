var React = require('react');
var StyleSheet = require('react-inline');
var cx = require('classnames');

const { oneOf, bool } = React.PropTypes;

class Button extends React.Component {
  render() {
    const { kind, size, busy, block, className } = this.props;
    const classes = cx(styles.default, styles[size], block && styles.block, className);

    return <button {...this.props} className={classes} disabled={busy} />;
  }
}

Button.propTypes = {
  size: oneOf(['large', 'small']),
  block: bool,
  busy: bool
};

const styles = {
  default: 'Button_js-styles-default',
  large: 'Button_js-styles-large',
  small: 'Button_js-styles-small',
  block: 'Button_js-styles-block'
};

module.exports = Button;
