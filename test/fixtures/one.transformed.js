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
          className: __cx(
            'a-class',
            "test_fixtures_one__styles1__first__1",
            "test_fixtures_one__styles2__first__4",
            "test_fixtures_one__styles1__second__2"
          ),
          ref: 'myDiv',
          style: dynamic1,
          lang: 'en'
        },
        React.createElement(
          'h1',
          { className: "test_fixtures_one__styles1__third__3" },
          'Headline'
        ),
        React.createElement(
          'ul',
          {
            className: __cx(classnames('foo', bar), "test_fixtures_one__styles2__second__5")
          },
          React.createElement(
            'li',
            { className: 'baz' },
            'Item 1'
          ),
          React.createElement(
            'li',
            {
              className: __cx(bar, "test_fixtures_one__styles1__first__1"),
              style: __assign({}, dynamic1, dynamic2)
            },
            'Item 2'
          ),
          React.createElement(
            'li',
            { className: __cx(
              "test_fixtures_one__styles1__first__1",
              "test_fixtures_one__styles1__second__2"
            ) },
            'Item 3'
          )
        )
      )
    );
  }
});

var __cx = require("classnames");
var __assign = require("react/lib/Object.assign");
