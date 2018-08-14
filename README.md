[![Build Status][build-image]][build-url] [![Coverage Status][coverage-image]][coverage-url]
# Shimapan
Shimapan is an easy to use file sharing website. It's easy to integrate shimapan into
most 3rd party utilities with the use of its RESTful API. The web panel gives users the
means to manage their uploaded content and various other useful utilities.

## Installation
Clone the latest release locally:
```bash
$ git clone https://github.com/Foltik/Shimapan
```

Next, install dependencies and build into `public/` with `npm`:
```bash
$ npm install
$ npm run build
```

Finally, start the Node.js server with:
```bash
$ npm start
```
Or optionally, monitor the source files, rebuilding and restarting the server
whenever changes are made with `nodemon` for easy live development:
```bash
$ npm run watch
```

## Other Notes
In order to contribute, please read the [Contributing](CONTRIBUTING.md) file.

[build-image]: https://travis-ci.com/Foltik/Shimapan.svg?branch=master
[build-url]: https://travis-ci.com/Foltik/Shimapan

[coverage-image]: https://img.shields.io/codecov/c/github/Foltik/shimapan/master.svg
[coverage-url]: https://codecov.io/gh/Foltik/Shimapan
