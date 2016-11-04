const format = require('util').format;

const CODES = {
  NOT_FOUND: 'NOT_FOUND',
  NOT_A_FILE: 'NOT_A_FILE'
};

const MESSAGES = {
  NOT_FOUND: 'File not found: %s',
  NOT_A_FILE: 'Resource is not a file: %s'
};

function FileResolveError(filepath, code) {
  Error.call(this);

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, arguments.callee); // eslint-disable-line
  }

  this.code = code;
  this.filepath = filepath;
  this.message = format(MESSAGES[code], filepath);
}

module.exports = FileResolveError;

FileResolveError.prototype = Object.create(Error.prototype);
FileResolveError.CODES = CODES;
