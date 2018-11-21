const { sample, isString } = require('lodash');
const removeNonNumber = str => (isString(str) ? str.replace(/\D+/g, '') : str);
const removeWhiteSpace = str => str.replace(/\s+/, '');
const sanitizeCurrency = str => parseFloat(str.replace('£', ''));
const cleanUpTime = arr => arr.map(str => parseFloat(removeNonNumber(str)));
const createDate = arr => {
  const hasDays = arr.length === 4;
  return arr.reduce((total, val, i) => {
    if (hasDays) {
      if (i === 0) {
        return total + val * 86400;
      } else if (i === 1) {
        return total + val * 3600;
      } else if (i === 2) {
        return total + val * 60;
      } else {
        return total + val;
      }
    } else {
      if (i === 0) {
        return total + val * 3600;
      } else if (i === 1) {
        return total + val * 60;
      } else {
        return total + val;
      }
    }
  }, 0);
};
exports.sanitize = (data, extra) => {
  data.timeLeft = createDate(cleanUpTime(data.timeLeft));
  data.nextBid = sanitizeCurrency(data.nextBid);
  data.currentBid = sanitizeCurrency(data.currentBid);
  return { ...data, ...extra };
};
