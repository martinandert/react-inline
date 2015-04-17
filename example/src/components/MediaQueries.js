import React from 'react';
import StyleSheet from 'react-inline';
import cx from 'classnames';

class MediaQueries extends React.Component {
  render() {
    return (
      <div>
        <h2>Media Queries</h2>

        <p>Resize your browser window to see how media queries take effect.</p>

        <p className={cx(styles.hidden, styles.small)}>
          This paragraph is only visible if your screen is <strong>at most 640 pixels</strong> wide.
        </p>

        <p className={cx(styles.hidden, styles.medium)}>
          This paragraph is only visible if your screen is <strong>between 641 and 1023 pixels</strong> wide.
        </p>

        <p className={cx(styles.hidden, styles.large)}>
          This paragraph is only visible if your screen is <strong>at least 1024 pixels</strong> wide.
        </p>
      </div>
    );
  }
}

export default MediaQueries;

const styles = StyleSheet.create({
  hidden: {
    display: 'none'
  },

  '@media (max-width: 640px)': {
    small: {
      display: 'block'
    }
  },

  '@media (min-width: 641px) and (max-width: 1023px)': {
    medium: {
      display: 'block'
    }
  },

  '@media (min-width: 1024px)': {
    large: {
      display: 'block'
    }
  }
});
