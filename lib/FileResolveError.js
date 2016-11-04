const CODES = {
  NOT_FOUND: 'NOT_FOUND',
  NOT_A_FILE: 'NOT_A_FILE'
};

function FileResolveError(filepath, code) {
  Error.call(this);

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, arguments.callee); // eslint-disable-line
  }

  this.message = `File not found: ${filepath}`;
  this.code = code;
}

module.exports = FileResolveError;

FileResolveError.prototype = Object.create(Error.prototype);
FileResolveError.CODES = CODES;
