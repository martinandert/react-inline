import React from 'react';
import StyleSheet from 'react-inline';
import MediaQueries from './MediaQueries';
import ButtonList from './ButtonList';

const repoUrl = 'https://github.com/martinandert/react-inline';
const codeUrl = `${repoUrl}/tree/master/example/src/components`;

class App extends React.Component {
  render() {
    return (
      <div className={styles.root}>
        <p>This is a small demonstration of what <a href={repoUrl}>React Inline</a> is capable of.</p>
        <p>Use your browser's "Inspect Element" tool to see inline styles turned into class names.</p>
        <p>You can find the code for all components <a href={codeUrl}>here</a>.</p>

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
