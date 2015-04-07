"use strict";

var React = require('react');
var StyleSheet = require('react-inline');
var classnames = require('classnames');

var One = React.createClass({
  render: function() {
    var dynamic1 = { marginButtom: 4, fontStyle: 'italic' };
    var dynamic2 = { display: 'inline-block' };

    var bar = 'bar';

    return (
      <div className="a-class" ref="myDiv" style={[styles1.first, styles2.first, styles1.second, dynamic1]} lang="en">
        <h1 style={styles1.third}>Headline</h1>

        <ul className={classnames('foo', bar)} style={styles2.second}>
          <li className="xyz">Item 1</li>
          <li className={bar} style={[styles1.first, dynamic1, dynamic2]}>Item 2</li>
          <li style={[styles1.first, styles1.second]}>Item 3</li>
        </ul>
      </div>
    );
  }
});

var styles1 = StyleSheet.create({
  first: {
    marginTop: 10,
    backgroundColor: 'red',
    border: 'solid 1px green'
  },

  second: {
    display: 'inline',
    flex: 1,
    ':hover': {
      fontSize: 12
    }
  },

  third: {
    borderWidth: 2,
    '@media only screen and (max-width: 320px)': {
      marginTop: 5
    }
  },

  '@phone': {
    first: {
      marginTop: 5
    }
  }
});

var styles2 = StyleSheet.create({
  first: {
    fontFamily: 'Helvetica,sans-serif'
  },

  second: {
    fontSize: 14,
    boxShadow: '0 0 10px 0 rgba(0,0,0, 0.25)'
  },

  unused: {
    color: 'red'
  }
});
