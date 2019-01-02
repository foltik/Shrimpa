const canonicalize = str => str.normalize('NFKD').toLowerCase();

module.exports = canonicalize;