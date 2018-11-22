require('dotenv').config();
const { sample, isString, find } = require('lodash');
const date = require('date-and-time');
const colors = require('colors');
const puppeteer = require('puppeteer');
const Bluebird = require('bluebird');
let mkdirp = require('mkdirp');
const path = require('path');
const fs = require('fs');
const Helpers = require('./helpers');
console.log(Helpers);
const START_BIDDING_AFTER_X_SECONDS =
  parseInt(process.env.START_BIDDING_AFTER_X_MINUTES) * 60;
const WATCH_INTERVAL = parseInt(process.env.WATCH_INTERVAL);
const LOGGING = !!parseInt(process.env.LOGGING);
const START_BIDDING = !!parseInt(process.env.START_BIDDING);
const FORCE_MAX_BID = !!parseInt(process.env.FORCE_MAX_BID);
const IS_OFFLINE = !!parseInt(process.env.OFFLINE);
const USERNAME = process.env.USERNAME;
console.log('START_BIDDING_AFTER_X_SECONDS', START_BIDDING_AFTER_X_SECONDS);
console.log('START_BIDDING', START_BIDDING);
console.log('IS_OFFLINE', IS_OFFLINE);
let sampleData;
if (IS_OFFLINE) {
  sampleData = require('./sample/scrape');
}
const INPUT_DATA = JSON.parse(fs.readFileSync('urls.json'));
const LOGIN = 'https://www.ppauctions.com/users/login.php';
const ACCOUNT = 'https://www.ppauctions.com/users/account.php';
const BIDDING = 'https://www.ppauctions.com/users/lots.php?bidding';

let MY_STATE = INPUT_DATA.map(obj => ({
  myLastBidAmount: 0,
  ...obj,
}));

const getApplyCredit = async page => {
  const credit = await getCredit(page);
  console.log(colors.green(`Credit: ${credit}`));
  MY_STATE.credit = credit;
};

const delay = milli => new Promise(yes => setTimeout(() => yes()), milli);

const readbid = async (page, url) => {
  await page.goto(url, { waitUntil: ['load', 'domcontentloaded'] });
  let content = await page.evaluate(sel => {
    const removeWhiteSpace = str => str.replace(/\s+/, '');
    /*const tl = document.querySelector('#tdTimeleft').innerHTML;
    console.log();
    if (tl.includes('CLOSED')) {
      return {
        closed: true,
        bidderUsername: removeWhiteSpace(
          document.querySelector('#tdHighBidder').innerHTML,
        ).trim(),
      };
    }*/
    return {
      lotName: removeWhiteSpace(document.querySelector('#divRHS h1').innerHTML),
      bids: parseInt(removeWhiteSpace(document.querySelector(sel).innerHTML), 10),
      desc: removeWhiteSpace(document.querySelector('#divLotBox_1 p').innerHTML).trim(),
      timeLeft: Array.from(document.querySelectorAll('#tdTimeleft span')).map(el =>
        removeWhiteSpace(el.innerHTML).trim(),
      ),
      bidderUsername: removeWhiteSpace(
        document.querySelector('#tdHighBidder').innerHTML,
      ).trim(),
      currentBid: removeWhiteSpace(
        document.querySelector('#spnCurrentBid')
          ? document.querySelector('#spnCurrentBid').innerHTML
          : '',
      ).trim(),
      nextBid: removeWhiteSpace(
        !!document.querySelector('#tdNextBid')
          ? document.querySelector('#tdNextBid').innerHTML
          : '',
      ).trim(),
      bidInputId: '#fmBid',
      lotCloses: removeWhiteSpace(
        document.querySelector('#tdLotCloses').innerHTML,
      ).trim(),
    };
  }, '#tdBids');
  if (!content.currentBid.length) {
    content.closed = true;
  }
  return Promise.resolve(Helpers.sanitize(content, { url }));
};

const makeBid = async (page, url, amount, lot) => {
  const myRecord = find(MY_STATE, { url: url });
  const maxBid = myRecord.maxBid || Infinity;
  if (amount - lot.currentBid > MY_STATE.credit) {
    console.log(colors.red(`Not enough credit (${MY_STATE.credit}). Aborting.`));
    return;
  }
  if (lot.bidderUsername === USERNAME) {
    console.log(colors.yellow(`You are already the max bidder! Aborting.`));
    return;
  }
  if (
    START_BIDDING_AFTER_X_SECONDS &&
    lot.timeLeft > START_BIDDING_AFTER_X_SECONDS &&
    !myRecord.startBidNow
  ) {
    console.log(
      colors.yellow(
        `Skipping ${lot.lotName}. Lot closes in ${Helpers.dateSecsToStr(
          new Date(lot.timeLeft * 1000),
        )}.  Will wait until ${START_BIDDING_AFTER_X_SECONDS}. Currently at ${
          lot.timeLeft
        }.`,
      ),
    );
    return false;
  }
  /***************
   *    cheat delay
   ************** */
  console.log(colors.blue(`Going to bid ${amount}. My maxBid is ${myRecord.maxBid}`));
  await page.goto(url, { waitUntil: ['load', 'domcontentloaded'] });
  if (!amount) throw new Error(`No amount to bid on: ${url}`);
  await page.waitForSelector('#fmBid');
  await page.waitForSelector('#frmBid');
  await page.waitForSelector('#frmBid input[type="button"]');
  await page.type('#fmBid', amount.toString());
  await Promise.all([
    page.waitForNavigation({ waitUntil: ['load', 'domcontentloaded'] }),
    page.click('#frmBid input[type="button"]'),
  ]);
  /***************
   *    !!!! SEE README #Setup
   ************** */
  //  const hasTnC = await page.$('.divTandCAccept');
  /*if (hasTnC) {
    console.log('hasTnC');
    const html = await page.content();
    await page.waitForSelector('.divTandCAccept');
    await Promise.all([
      page.waitForNavigation({ waitUntil: ['load', 'domcontentloaded'] }),
      page.click('.divTandCAccept input[value="I Agree"]'),
    ]);
  }*/
  await page.waitForSelector('.yourbid', { visible: true });
  await Promise.all([
    page.waitForNavigation({ waitUntil: ['load', 'domcontentloaded'] }),
    page.click('.pBid input[type="button"]'),
  ]);
  await page.waitForSelector('.trBiddingRow');
  const highBidderUsername = await page.evaluate(sel => {
    const removeWhiteSpace = str => str.replace(/\s+/, '');
    return removeWhiteSpace(document.querySelector('#tdHighBidder').innerHTML);
  });
  if (highBidderUsername !== USERNAME) {
    //FAILED
    return false;
  } else {
    await getApplyCredit(page);
    return true;
  }
};

const loggin = async page => {
  await page.goto(LOGIN, { waitUntil: ['load', 'domcontentloaded'] });
  const usernaneSelector = '#fmUsername';
  await page.waitForSelector(usernaneSelector);
  await page.type(usernaneSelector, process.env.USERNAME);
  const passwordSelector = '#fmPassword';
  await page.type(passwordSelector, process.env.PASSWORD);
  await page.click('.tblForm input[type="submit"]');
  await page.waitForSelector('#divLoggedIn');
};

const getCredit = async page => {
  await page.goto(ACCOUNT, { waitUntil: ['load', 'domcontentloaded'] });
  const remainingCredit = await page.evaluate(sel => {
    return document.querySelector('#spnCredit').innerHTML.trim();
  }, '#divCredit');
  return Helpers.sanitizeCurrency(remainingCredit);
};

/***************
 *    FIRST CHECK THE LOT
 ************** */
const checkLot = async (lot, page) => {
  const myRecord = find(MY_STATE, { url: lot.url });
  if (lot.closed) {
    console.log(colors.yellow(`${lot.lotName} Closed. Aborting`));
    return;
  }
  if (isString(myRecord.maxBid) && FORCE_MAX_BID) {
    console.log(
      colors.yellow(`${myRecord.maxBid} is a string. Make it a number! Aborting.`),
    );
    return;
  }
  if (lot.bidderUsername === USERNAME) {
    console.log(colors.yellow(`You are already the max bidder! Aborting.`));
    return;
  }
  if (lot.currentBid > myRecord.myLastBidAmount && lot.nextBid > myRecord.maxBid) {
    console.log(
      colors.red(
        `trying to bid ${lot.nextBid} on ${lot.desc}.  Will NOT bid because max bid is: ${
          myRecord.maxBid
        }`,
      ),
    );
  } else if (
    ((FORCE_MAX_BID && lot.currentBid < myRecord.maxBid) || !FORCE_MAX_BID) &&
    !IS_OFFLINE &&
    lot.bidderUsername !== USERNAME
  ) {
    //DO BID
    const success = await makeBid(page, lot.url, lot.nextBid, lot);
    if (success) {
      myRecord.myLastBidAmount = lot.nextBid;
      console.log(colors.green(`Bid ${lot.nextBid} on ${lot.desc}`));
      return true;
    }
  }
  return false;
};

const watchBidLoop = async page => {
  if (LOGGING) {
    console.log('\n');
    console.log('watchBidLoop');
  }
  /***************
   *   . Read current lots and build data
   ************** */
  const allBids = await Bluebird.map(INPUT_DATA, ({ url }) => readbid(page, url), {
    concurrency: 1,
  });
  if (LOGGING) {
    console.log('ALL BIDS:');
    console.log(allBids);
  }
  /***************
   *    Check the lot and bid if needed
   ************** */
  await Bluebird.map(allBids, lot => checkLot(lot, page), {
    concurrency: 1,
  });

  setTimeout(function() {
    watchBidLoop(page);
  }, WATCH_INTERVAL);
};

const beginScrape = async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  //loggin
  await loggin(page);
  console.log('Logged in');
  await getApplyCredit(page);

  watchBidLoop(page);
};

if (!IS_OFFLINE) {
  beginScrape();
}
