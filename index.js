const rp = require('request-promise');
const $ = require('cheerio');
const url = 'https://fontmeme.com/fonts/page/1/';
const R = require('ramda');
const download = require('download-file')
const fs = require('fs');
const toStream = require('buffer-to-stream')
const unzipper = require('unzipper');

rp(url).then(html => {
  const tags = $('#ptitle > a', html);
  const urls = R.pipe(
    R.values,
    R.map(R.path(['attribs', 'href'])),
    R.reject(R.isNil),
  )(tags);

  const requests = R.pipe(
    R.map(rp),
  )(urls);

  return Promise.all(requests);
}).then(htmls => {
  const downloadSelector = '#dllink > div.downloadButtonElement > div:nth-child(3)';
  const downloadUrls = R.pipe(
    R.map(html => $(downloadSelector, html)),
    R.map(R.path(['0', 'attribs', 'onclick'])),
    R.map(R.slice(17, -2)),
  )(htmls);

  const requests = R.pipe(
    R.map(url => rp.get({
      encoding: null,
      url,
    })),
  )(downloadUrls);

  const names = R.pipe(
    R.map(R.split('/')),
    R.map(R.nth(-1))
  )(downloadUrls);

  return Promise.all([
    Promise.all(requests),
    Promise.resolve(names),
  ]);
}).then(([ files, names ]) => {
  /*
  const saveFiles = R.pipe(
    R.map(([buffer, name]) => {
      //console.log(buffer, name);
      console.log(name);
      const directory = unzipper.Open.buffer(buffer);
      return directory;
    }),
  )(R.zip(files, names));
  */

  return Promise.all(
    R.map((buffer) => {
      return unzipper.Open.buffer(buffer);
    })(files)
  );

  //return Promise.all(saveFiles);
}).then(results => {
  console.log('Saved all the files', results);
}).catch(console.error);
