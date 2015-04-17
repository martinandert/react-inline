import React from 'react';
import StyleSheet from 'react-inline';
import cx from 'classnames';

class MediaQueries extends React.Component {
  render() {
    return (
      <div>
        <h2>Media Queries</h2>

        <p>Resize your browser window (or change your phone's orientation) to see how media queries take effect.</p>

        <p className={cx(styles.hidden, styles.small)}>
          This paragraph is only visible if your screen is <strong>at most 320 logical pixels</strong> wide.
        </p>

        <p className={cx(styles.hidden, styles.medium)}>
          This paragraph is only visible if your screen is <strong>between 321 and 767 logical pixels</strong> wide.
        </p>

        <p className={cx(styles.hidden, styles.large)}>
          This paragraph is only visible if your screen is <strong>between 768 and 1279 logical pixels</strong> wide.
        </p>

        <p className={cx(styles.hidden, styles.xlarge)}>
          This paragraph is only visible if your screen is <strong>at least 1280 logical pixels</strong> wide.
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

  '@media (max-width: 320px)': {
    small: {
      display: 'block'
    }
  },

  '@media (min-width: 321px) and (max-width: 767px)': {
    medium: {
      display: 'block'
    }
  },

  '@media (min-width: 768px) and (max-width: 1279px)': {
    large: {
      display: 'block'
    }
  },

  '@media (min-width: 1280px)': {
    xlarge: {
      display: 'block'
    }
  }
});
