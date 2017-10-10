var index = require('./routes/index.js');
var upload = require('./routes/upload.js');
var view = require('./routes/view.js');

module.exports = function(app) {
    app.use('/', index);
    app.use('/v', view);
    app.use('/upload', upload);
};
