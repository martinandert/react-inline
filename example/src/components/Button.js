import React from 'react';
import StyleSheet from 'react-inline';
import classNames from 'classnames';

const {oneOf, bool} = React.PropTypes;

class Button extends React.Component {
  render() {
    const {kind, size, busy, block, className} = this.props;

    const classes = classNames(
      styles.default,
      styles[kind],
      styles[size],
      block && styles.block,
      className
    );

    return <button {...this.props} className={classes} disabled={busy} />;
  }
}

Button.kinds = ['primary', 'success', 'info', 'warning', 'danger', 'link'];
Button.sizes = ['large', 'small', 'tiny'];

Button.propTypes = {
  kind:   oneOf(Button.kinds),
  size:   oneOf(Button.sizes),
  block:  bool,
  busy:   bool
};

export default Button;

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
    color: '#333',
    backgroundColor: '#fff',
    borderColor: '#ccc',

    ':focus': {
      color: '#333',
      backgroundColor: '#e6e6e6',
      borderColor: '#8c8c8c',
      outline: 'thin dotted',
      outlineOffset: -2
    },

    ':hover': {
      color: '#333',
      backgroundColor: '#e6e6e6',
      borderColor: '#adadad',
      textDecoration: 'none'
    },

    ':active': {
      color: '#333',
      backgroundColor: '#e6e6e6',
      borderColor: '#adadad',
      backgroundImage: 'none',
      outline: 0,
      boxShadow: 'inset 0 3px 5px rgba(0, 0, 0, .125)',

      ':hover': {
        color: '#333',
        backgroundColor: '#d4d4d4',
        borderColor: '#8c8c8c'
      }
    },

    '[disabled]': {
      backgroundColor: '#fff',
      borderColor: '#ccc',
      cursor: 'not-allowed',
      filter: 'alpha(opacity=65)',
      boxShadow: 'none',
      opacity: .65,
      pointerEvents: 'none'
    }
  },

  primary: {
    color: '#fff',
    backgroundColor: '#337ab7',
    borderColor: '#2e6da4',

    ':focus': {
      color: '#fff',
      backgroundColor: '#286090',
      borderColor: '#122b40'
    },

    ':hover': {
      color: '#fff',
      backgroundColor: '#286090',
      borderColor: '#204d74'
    },

    ':active': {
      color: '#fff',
      backgroundColor: '#286090',
      borderColor: '#204d74',

      ':hover': {
        color: '#fff',
        backgroundColor: '#204d74',
        borderColor: '#122b40'
      }
    },

    '[disabled]': {
      backgroundColor: '#337ab7',
      borderColor: '#2e6da4'
    }
  },

  success: {
    color: '#fff',
    backgroundColor: '#5cb85c',
    borderColor: '#4cae4c',

    ':focus': {
      color: '#fff',
      backgroundColor: '#449d44',
      borderColor: '#255625'
    },

    ':hover': {
      color: '#fff',
      backgroundColor: '#449d44',
      borderColor: '#398439'
    },

    ':active': {
      color: '#fff',
      backgroundColor: '#449d44',
      borderColor: '#398439',

      ':hover': {
        color: '#fff',
        backgroundColor: '#398439',
        borderColor: '#255625'
      }
    },

    '[disabled]': {
      backgroundColor: '#5cb85c',
      borderColor: '#4cae4c'
    }
  },

  info: {
    color: '#fff',
    backgroundColor: '#5bc0de',
    borderColor: '#46b8da',

    ':focus': {
      color: '#fff',
      backgroundColor: '#31b0d5',
      borderColor: '#1b6d85'
    },

    ':hover': {
      color: '#fff',
      backgroundColor: '#31b0d5',
      borderColor: '#269abc'
    },

    ':active': {
      color: '#fff',
      backgroundColor: '#31b0d5',
      borderColor: '#269abc',

      ':hover': {
        color: '#fff',
        backgroundColor: '#269abc',
        borderColor: '#1b6d85'
      }
    },

    '[disabled]': {
      backgroundColor: '#5bc0de',
      borderColor: '#46b8da'
    }
  },

  warning: {
    color: '#fff',
    backgroundColor: '#f0ad4e',
    borderColor: '#eea236',

    ':focus': {
      color: '#fff',
      backgroundColor: '#ec971f',
      borderColor: '#985f0d'
    },

    ':hover': {
      color: '#fff',
      backgroundColor: '#ec971f',
      borderColor: '#d58512'
    },

    ':active': {
      color: '#fff',
      backgroundColor: '#ec971f',
      borderColor: '#d58512',

      ':hover': {
        color: '#fff',
        backgroundColor: '#d58512',
        borderColor: '#985f0d'
      }
    },

    '[disabled]': {
      backgroundColor: '#f0ad4e',
      borderColor: '#eea236'
    }
  },

  danger: {
    color: '#fff',
    backgroundColor: '#d9534f',
    borderColor: '#d43f3a',

    ':focus': {
      color: '#fff',
      backgroundColor: '#c9302c',
      borderColor: '#761c19'
    },

    ':hover': {
      color: '#fff',
      backgroundColor: '#c9302c',
      borderColor: '#ac2925'
    },

    ':active': {
      color: '#fff',
      backgroundColor: '#c9302c',
      borderColor: '#ac2925',

      ':hover': {
        color: '#fff',
        backgroundColor: '#ac2925',
        borderColor: '#761c19'
      }
    },

    '[disabled]': {
      backgroundColor: '#d9534f',
      borderColor: '#d43f3a'
    }
  },

  link: {
    fontWeight: 'normal',
    borderRadius: 0,
    color: '#337ab7',
    backgroundColor: 'transparent',
    borderColor: 'transparent',

    ':focus': {
      borderColor: 'transparent',
      color: '#23527c',
      textDecoration: 'underline',
      backgroundColor: 'transparent'
    },

    ':hover': {
      borderColor: 'transparent',
      color: '#23527c',
      textDecoration: 'underline',
      backgroundColor: 'transparent'
    },

    ':active': {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      boxShadow: 'none'
    },

    '[disabled]': {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      boxShadow: 'none',

      ':focus': {
        color: '#777',
        textDecoration: 'none'
      },

      ':hover': {
        color: '#777',
        textDecoration: 'none'
      }
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

  tiny: {
    padding: '1px 5px',
    fontSize: 12,
    lineHeight: 1.5,
    borderRadius: 3
  },

  block: {
    display: 'block',
    width: '100%'
  }
});
