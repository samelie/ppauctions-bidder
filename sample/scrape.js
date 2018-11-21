let date = require('date-and-time');
const { sample, isString } = require('lodash');
const INTERVAL_INCREASE = 1000;

const sanitizeCurrency = str => parseFloat(str.replace('£', ''));
const removeNonNumber = str => (isString(str) ? str.replace(/\D+/g, '') : str);
const cleanUpTime = arr => arr.map(str => parseFloat(removeNonNumber(str)));

/*const cleanUpTime = arr =>
  arr.reduce((str, item) => {
    if (str.includes('days')) return str;
    if (str.includes('hours')) return `${str}:${str.replace('hours', '')}`;
    if (str.includes('mins')) return `${str}:${str.replace('hours', '')}`;
  }, '');
*/

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

const SIMULATE_MAX_BID = () => Math.round(Math.random() * 400 + 100);

const sanitize = data =>
  data.forEach(item => {
    item.currentBid = sanitizeCurrency(item.currentBid);
    item.nextBid = sanitizeCurrency(item.nextBid);
  });

const prepareData = data =>
  data.forEach(item => {
    item.secondsLeft = createDate(cleanUpTime(item.timeLeft));
    item.myLastBid = 0;
    item.myMaxBid = SIMULATE_MAX_BID();
  });

const increment = (data, contraints, num = 1) => {
  //const item = sample(data);
  const item = data[2];
  const nextBid = parseFloat(removeNonNumber(item.nextBid));

  item.secondsLeft -= INTERVAL_INCREASE / 1000;
  item.bids++;
  item.currentBid = nextBid;
  item.nextBid = nextBid * 1.05;

  if (item.secondsLeft <= 120) {
    item.secondsLeft += 120;
  }

  if (item.currentBid > item.myLastBid && item.nextBid > item.myMaxBid) {
    console.error(`trying ${item.nextBid}, Will not bid further than ${item.myMaxBid}`);
  } else if (item.currentBid > item.myLastBid) {
    //DO BID
    item.bids++;
    item.myLastBid = item.nextBid;
    item.currentBid = item.nextBid;
    item.nextBid = item.currentBid * 1.05;
  }

  console.log(item);
};
module.exports = (() => {
  let scrapeData = [
    {
      lotName: 'Lot 142\t\t',
      bids: 9,
      desc:
        'SonyHVR-Z1E HD video camera recorder with battery &amp; flash unit (no charger) - Located at: BBC Wales - Cardiff.',
      timeLeft: ['1days, ', '6hours, ', '36mins and ', '48secs'],
      currentBid: '£26.00',
      nextBid: '£27.00\t\t\t\t\t',
      bidInputId: '#fmBid',
      lotCloses: '22 November 2018 - 10:40:30 UK Time\t\t\t\t\t',
    },

    {
      lotName: 'Lot 151\t\t',
      bids: 11,
      desc:
        'SonyHVR-Z1E HD video camera recorder with battery &amp; flash unit (no charger) - Located at: BBC Wales - Cardiff.',
      timeLeft: ['1days, ', '6hours, ', '41mins and ', '19secs'],
      currentBid: '£26.00',
      nextBid: '£27.00\t\t\t\t\t',
      bidInputId: '#fmBid',
      lotCloses: '22 November 2018 - 10:45:00 UK Time\t\t\t\t\t',
    },

    {
      lotName: 'Lot 105\t\t',
      bids: 10,
      desc:
        'SonyHVR-Z1E HD video camera recorder with battery &amp; flash unit (no charger) - Located at: BBC Wales - Cardiff.',
      timeLeft: ['1days, ', '6hours, ', '18mins and ', '19secs'],
      currentBid: '£31.00',
      nextBid: '£32.00\t\t\t\t\t',
      bidInputId: '#fmBid',
      lotCloses: '22 November 2018 - 10:22:00 UK Time\t\t\t\t\t',
    },

    {
      lotName: 'Lot 497\t\t',
      bids: 7,
      desc:
        '2xSony DCR-TRV330E digital video camera recorders - Located at: BBC Wales - Cardiff.',
      timeLeft: ['1days, ', '9hours, ', '34mins and ', '20secs'],
      currentBid: '£16.00',
      nextBid: '£17.00\t\t\t\t\t',
      bidInputId: '#fmBid',
      lotCloses: '22 November 2018 - 13:38:00 UK Time\t\t\t\t\t',
    },

    {
      lotName: 'Lot 223\t\t',
      bids: 3,
      desc: 'EpsomEMP-5350, Infocus projectors - Located at: BBC Wales - Cardiff.',
      timeLeft: ['1days, ', '7hours, ', '17mins and ', '20secs'],
      currentBid: '£12.00',
      nextBid: '£13.00\t\t\t\t\t',
      bidInputId: '#fmBid',
      lotCloses: '22 November 2018 - 11:21:00 UK Time\t\t\t\t\t',
    },

    {
      lotName: 'Lot 287\t\t',
      bids: 0,
      desc: '3xvarious projector bulb modules - Located at: BBC Wales - Cardiff.',
      timeLeft: ['1days, ', '7hours, ', '49mins and ', '21secs'],
      currentBid: '£10.00',
      nextBid: '£10.00\t\t\t\t\t',
      bidInputId: '#fmBid',
      lotCloses: '22 November 2018 - 11:53:00 UK Time\t\t\t\t\t',
    },

    {
      lotName: 'Lot 116\t\t',
      bids: 1,
      desc: 'FujiFilmA18x76berm-M48 lens - Located at: BBC Wales - Cardiff.',
      timeLeft: ['1days, ', '6hours, ', '23mins and ', '51secs'],
      currentBid: '£10.00',
      nextBid: '£11.00\t\t\t\t\t',
      bidInputId: '#fmBid',
      lotCloses: '22 November 2018 - 10:27:30 UK Time\t\t\t\t\t',
    },

    {
      lotName: 'Lot 117\t\t',
      bids: 1,
      desc: 'ConorYJ18x9B4 KRS 5x12 lens - Located at: BBC Wales - Cardiff.',
      timeLeft: ['1days, ', '6hours, ', '24mins and ', '21secs'],
      currentBid: '£10.00',
      nextBid: '£11.00\t\t\t\t\t',
      bidInputId: '#fmBid',
      lotCloses: '22 November 2018 - 10:28:00 UK Time\t\t\t\t\t',
    },

    {
      lotName: 'Lot 81\t\t',
      bids: 21,
      desc: 'AudioTechnica AT825 microphone in case - Located at: BBC Wales - Cardiff.',
      timeLeft: ['1days, ', '6hours, ', '6mins and ', '22secs'],
      currentBid: '£38.00',
      nextBid: '£39.00\t\t\t\t\t',
      bidInputId: '#fmBid',
      lotCloses: '22 November 2018 - 10:10:00 UK Time\t\t\t\t\t',
    },

    {
      lotName: 'Lot 552\t\t',
      bids: 2,
      desc: 'BBC56412 microphone - Located at: BBC Wales - Cardiff.',
      timeLeft: ['1days, ', '10hours, ', '1min and ', '52secs'],
      currentBid: '£11.00',
      nextBid: '£12.00\t\t\t\t\t',
      bidInputId: '#fmBid',
      lotCloses: '22 November 2018 - 14:05:30 UK Time\t\t\t\t\t',
    },

    {
      lotName: 'Lot 554\t\t',
      bids: 17,
      desc: 'BayerDynamics M58N(C) microphone - Located at: BBC Wales - Cardiff.',
      timeLeft: ['1days, ', '10hours, ', '2mins and ', '53secs'],
      currentBid: '£55.00',
      nextBid: '£60.00\t\t\t\t\t',
      bidInputId: '#fmBid',
      lotCloses: '22 November 2018 - 14:06:30 UK Time\t\t\t\t\t',
    },

    {
      lotName: 'Lot 671\t\t',
      bids: 28,
      desc:
        'AudioDevelopments AD146 10 channel mixer, customised button control unit - Located at: BBC Wales - Cardiff.',
      timeLeft: ['1days, ', '11hours, ', '1min and ', '23secs'],
      currentBid: '£765.00',
      nextBid: '£785.00\t\t\t\t\t',
      bidInputId: '#fmBid',
      lotCloses: '22 November 2018 - 15:05:00 UK Time\t\t\t\t\t',
    },
  ];
  sanitize(scrapeData);
  prepareData(scrapeData);

  setInterval(() => {
    console.log('\n\n\n\n');
    increment(scrapeData);
  }, INTERVAL_INCREASE);

  return {
    fetch: () => scrapeData,
  };
})();
