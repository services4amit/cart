
var express = require('express');


var logger = require('morgan');


var app = express();

const port = 3100;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;
