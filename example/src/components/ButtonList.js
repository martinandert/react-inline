import React from 'react';
import StyleSheet from 'react-inline';
import Button from './Button';

class ButtonList extends React.Component {
  render() {
    return (
      <div>
        <h2>Bootstrap's buttons, realized with React Inline</h2>

        <p>Enumerating Bootstrap-style buttons of all types and sizes.</p>

        <ul className={styles.list}>{this.renderButtons()}</ul>
      </div>
    );
  }

  renderButtons() {
    let buttons = [];

    this.getButtonSizes().forEach((size) => {
      [undefined, true].forEach((busy) => {
        this.getButtonKinds().forEach((kind) => {
          const label = (busy ? 'disabled ' : '') + (size ? size + ' ' : '') + (kind ? kind + ' ' : '') + 'button';
          const handleClick = function() { alert('You clicked the ' + label + '.'); };

          buttons.push(
            <Button size={size} busy={busy} kind={kind} onClick={handleClick}>
              {label}
            </Button>
          );
        });
      });
    });

    buttons.push(
      <Button size="large" block={true} className={styles.blackButton}>
        large block button with custom styling
      </Button>
    );

    return buttons.map((button, i) => {
      return <li key={i}>{button}</li>;
    });
  }

  getButtonSizes() {
    return [undefined].concat(Button.sizes);
  }

  getButtonKinds() {
    return [undefined].concat(Button.kinds);
  }
}

export default ButtonList;

var styles = StyleSheet.create({
  blackButton: {
    color: '#999',
    backgroundColor: 'black',
    borderColor: 'black'
  },

  list: {
    paddingLeft: 0,
    listStyleType: 'none'
  }
});

