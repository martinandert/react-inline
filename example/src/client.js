import React  from 'react';
import Root   from './components/Root';

class MyApp extends React.Component {
  render() {
    return (
      <Root />
    );
  }
}

export default MyApp;

if (typeof window !== 'undefined') {
  React.initializeTouchEvents(true);
  React.render(<MyApp />, document.getElementById('mount'));
}
