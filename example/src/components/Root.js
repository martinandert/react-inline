import React from 'react';
import StyleSheet from 'react-inline';
import Button from './Button';

class Root extends React.Component {
  render() {
    let buttons = [];

    [undefined].concat(Button.sizes).forEach((size) => {
      [undefined, true].forEach((busy) => {
        [undefined].concat(Button.kinds).forEach((kind) => {
          const label = (busy ? 'disabled ' : '') + (size ? size + ' ' : '') + (kind ? kind + ' ' : '') + 'button';
          const handleClick = function() { alert('You clicked the ' + label + '.'); };

          buttons.push(<Button size={size} busy={busy} kind={kind} onClick={handleClick}>{label}</Button>);
        });
      });
    });

    buttons.push(<Button size="large" block={true} className={styles.blackButton}>large block button with custom styling</Button>);

    return (
      <div className={styles.root}>
        <h1 className={styles.head}>A ugly-looking white headline on gray background</h1>
        <p>Use your browser's "Inspect Element" tool to see styles turned into class names.</p>

        <h2>Bootstrap's buttons</h2>
        <ul>
          {buttons.map((button, i) => {
            return <li key={i} className={styles.listItem}>{button}</li>;
          })}
        </ul>
      </div>
    )
  }
}

const styles = StyleSheet.create({
  root: {
    padding: 50
  },

  head: {
    color: 'white',
    backgroundColor: 'gray'
  },

  listItem: {
    listStyle: 'none'
  },

  blackButton: {
    color: '#999',
    backgroundColor: 'black',
    borderColor: 'black'
  }
});

export default Root;
