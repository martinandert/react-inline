// const React = require('react');
// const StyleSheet = require('react-inline');

import React from 'react';
import StyleSheet from 'react-inline';

class Root extends React.Component {
  render() {
    return (
      <div style={styles.root}>
        <h1 className="headline" style={styles.head}>A white headline on black background</h1>
        <p>Use the "Inspect Element" tool of your browser to see inline styles turned into class names.</p>
      </div>
    )
  }
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#eee'
  },

  head: {
    color: 'white'
  }
});

export default Root;
