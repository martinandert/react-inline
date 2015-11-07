import express      from 'express';
import compression  from 'compression';
import serveFavicon from 'serve-favicon';
import expiry       from 'static-expiry';
import logger       from 'morgan';
import errorHandler from 'errorhandler';
import {normalize}  from 'path';

import React    from 'react';
import ReactDOM from 'react-dom/server';
import App      from './components/App';

const app         = express();
const port        = process.env.PORT || 3000;
const live        = app.get('env') === 'production';
const publicPath  = normalize(__dirname + '/../public');

app.set('view engine', 'ejs');

app.use(compression());
app.use(serveFavicon(publicPath + '/favicon.ico'));
app.use(expiry(app, { dir: publicPath, location: 'postfile' }));
app.use(express.static(publicPath, { index: false }));
app.use(logger(live ? 'combined' : 'dev'));

app.get('/', (req, res, next) => {
  const html = ReactDOM.renderToString(<App />);
  res.render('layout', { html });
});

if (!live) {
  app.use(errorHandler());
}

app.listen(port, () => {
  console.log(`Running in ${app.get('env')} environment`);
  console.log(`Listening at http://localhost:${port}`);
});
