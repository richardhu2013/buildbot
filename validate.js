'use strict';

module.exports = {
  isNumeric: (n) => {
    return !isNaN(parseFloat(n)) && isFinite(n);
  },
};
