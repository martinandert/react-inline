import React from 'react';
import App from './components/App';

const mountNode = document.getElementById('mount');

React.initializeTouchEvents(true);
React.render(<App />, mountNode);
