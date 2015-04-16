var React = require('react');

var cx = require('classnames');

const { oneOf, bool } = React.PropTypes;

class Button extends React.Component {
  render() {
    const { size, busy, block, className } = this.props;
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
  default: '_0',
  large: '_1',
  small: '_2',
  block: '_3'
};

module.exports = Button;