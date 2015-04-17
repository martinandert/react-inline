import React from 'react';
import StyleSheet from 'react-inline';
import MediaQueries from './MediaQueries';
import ButtonList from './ButtonList';

const url = 'https://github.com/martinandert/react-inline/tree/master/example/src/components';

class App extends React.Component {
  render() {
    return (
      <div className={styles.root}>
        <p>Use your browser's "Inspect Element" tool to see inline styles turned into class names.</p>
        <p>You can find the code for all components <a href={url}>here</a>.</p>

        <MediaQueries />
        <ButtonList />
      </div>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    padding: 50,

    '@phone': {
      padding: 15
    }
  }
});

export default App;
