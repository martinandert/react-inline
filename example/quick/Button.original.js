var React = require('react');
var StyleSheet = require('react-inline');
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
  size:   oneOf(['large', 'small']),
  block:  bool,
  busy:   bool
};

const styles = StyleSheet.create({
  default: {
    display: 'inline-block',
    padding: '6px 12px',
    marginBottom: 0,
    fontSize: 14,
    fontWeight: 'normal',
    lineHeight: 1.5,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    touchAction: 'manipulation',
    cursor: 'pointer',
    userSelect: 'none',
    backgroundImage: 'none',
    border: '1px solid transparent',
    borderRadius: 4,
    color: '#fff',
    backgroundColor: '#337ab7',
    borderColor: '#2e6da4',

    '@media only screen and (max-width: 640px)': {
      display: 'block',
      width: '100%'
    },

    ':focus': {
      color: '#fff',
      backgroundColor: '#286090',
      borderColor: '#122b40',
      outline: 'thin dotted',
      outlineOffset: -2
    },

    ':hover': {
      color: '#fff',
      backgroundColor: '#286090',
      borderColor: '#204d74',
      textDecoration: 'none'
    },

    ':active': {
      color: '#fff',
      backgroundColor: '#286090',
      borderColor: '#204d74',
      backgroundImage: 'none',
      outline: 0,
      boxShadow: 'inset 0 3px 5px rgba(0, 0, 0, .125)',

      ':hover': {
        color: '#fff',
        backgroundColor: '#204d74',
        borderColor: '#122b40'
      }
    },

    '[disabled]': {
      backgroundColor: '#337ab7',
      borderColor: '#2e6da4',
      cursor: 'not-allowed',
      filter: 'alpha(opacity=65)',
      boxShadow: 'none',
      opacity: .65,
      pointerEvents: 'none'
    }
  },

  large: {
    padding: '10px 16px',
    fontSize: 18,
    lineHeight: 1.33,
    borderRadius: 6
  },

  small: {
    padding: '5px 10px',
    fontSize: 12,
    lineHeight: 1.5,
    borderRadius: 3
  },

  block: {
    display: 'block',
    width: '100%'
  }
});

module.exports = Button;
