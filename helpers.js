const { sample, compact, isString } = require('lodash');
const removeNonNumber = str => (isString(str) ? str.replace(/\D+/g, '') : str);
const removeWhiteSpace = (str = '') => str.replace(/\s+/, '');
const sanitizeCurrency = (str = '') => parseFloat(str.replace('£', '').replace(/,/g, ''));
exports.sanitizeCurrency = sanitizeCurrency;
const cleanUpTime = arr =>
  compact(arr.map(str => (str.length ? parseFloat(removeNonNumber(str)) : null)));

const createDate = arr => {
  const hasDays = arr.length === 4;
  /* **************
  IF ARRAY IS
  [HOURS, MINS, SECONDS]
  [MINS, SECONDS]
  [SECONDS]

  REVERSE()
  ************** */
  arr = arr.reverse();
  return arr.reduce((total, val, i) => {
    if (i === 0) {
      return total + val;
    } else if (i === 1) {
      return total + val * 60;
    } else if (i === 2) {
      return total + val * 3600;
    } else {
      return total + val * 86400;
    }
  }, 0);
};
const sanitize = (data, extra) => {
  data.timeLeft = data.timeLeft ? createDate(cleanUpTime(data.timeLeft)) : '';
  data.nextBid = sanitizeCurrency(data.nextBid);
  data.currentBid = sanitizeCurrency(data.currentBid);
  return { ...data, ...extra };
};
exports.sanitize = sanitize;

const dateSecsToStr = datev =>
  `${datev.getUTCHours()}:${datev.getUTCMinutes()}:${datev.getSeconds()}`;
exports.dateSecsToStr = dateSecsToStr;
