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
          className: __cx('a-class', "_1", "_4", "_2"),
          ref: 'myDiv',
          style: dynamic1,
          lang: 'en'
        },
        React.createElement(
          'h1',
          { className: "_3" },
          'Headline'
        ),
        React.createElement(
          'ul',
          {
            className: __cx(classnames('foo', bar), "_5")
          },
          React.createElement(
            'li',
            { className: 'baz' },
            'Item 1'
          ),
          React.createElement(
            'li',
            {
              className: __cx(bar, "_1"),
              style: __assign({}, dynamic1, dynamic2)
            },
            'Item 2'
          ),
          React.createElement(
            'li',
            { className: __cx("_1", "_2") },
            'Item 3'
          )
        )
      )
    );
  }
});

var __cx = require("classnames");
var __assign = require("react/lib/Object.assign");
