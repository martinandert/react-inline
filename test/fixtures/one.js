"use strict";

var React = require('react');
var StyleSheet = require('react-inline');
var classnames = require('classnames');

var One = React.createClass({
  render: function() {
    var dynamic1 = {
      marginButtom: 4,
      fontStyle: 'italic'
    };

    var dynamic2 = {
      display: 'inline-block'
    };

    var bar = 'bar';

    return (
      React.createElement(
        'div',
        {
          className: 'a-class',
          ref: 'myDiv',
          style: [styles1.first, styles2.first, styles1.second, dynamic1],
          lang: 'en'
        },
        React.createElement(
          'h1',
          { style: styles1.third },
          'Headline'
        ),
        React.createElement(
          'ul',
          {
            className: classnames('foo', bar),
            style: styles2.second
          },
          React.createElement(
            'li',
            { className: 'baz' },
            'Item 1'
          ),
          React.createElement(
            'li',
            {
              className: bar,
              style: [styles1.first, dynamic1, dynamic2]
            },
            'Item 2'
          ),
          React.createElement(
            'li',
            { style: [styles1.first, styles1.second] },
            'Item 3'
          )
        )
      )
    );
  }
});

var styles1 = StyleSheet.create({
  first: {
    marginTop: 10,
    backgroundColor: 'red'
  },

  second: {
    display: 'inline',
    flex: 1
  },

  third: {
    borderWidth: 2
  }
});

var styles2 = StyleSheet.create({
  first: {
    fontFamily: 'Helvetica,sans-serif'
  },

  second: {
    fontSize: 14
  }
});
