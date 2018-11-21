require('dotenv').config();
const { sample, isString, find } = require('lodash');
const colors = require('colors');
const puppeteer = require('puppeteer');
const Bluebird = require('bluebird');
let mkdirp = require('mkdirp');
const path = require('path');
const Helpers = require('./helpers');
const fs = require('fs');
const WATCH_INTERVAL = parseInt(process.env.WATCH_INTERVAL);
const START_BIDDING = !!parseInt(process.env.START_BIDDING);
const IS_OFFLINE = !!parseInt(process.env.OFFLINE);
console.log('START_BIDDING', START_BIDDING);
console.log('IS_OFFLINE', IS_OFFLINE);
let sampleData;
if (IS_OFFLINE) {
  sampleData = require('./sample/scrape');
}
const INPUT_DATA = JSON.parse(fs.readFileSync('urls.json'));
const LOGIN = 'https://www.ppauctions.com/users/login.php';
const OUTPUT = 'saves';
const SAVES_OUTPUT = path.join(OUTPUT, `bids.json`);
mkdirp.sync(OUTPUT);

const writeSave = data => fs.writeFileSync(SAVES_OUTPUT, JSON.stringify(data, null, 4));

if (!fs.existsSync(SAVES_OUTPUT)) {
  writeSave(INPUT_DATA);
}

let MY_STATE = JSON.parse(fs.readFileSync(SAVES_OUTPUT)).map(obj => ({
  myLastBidAmount: 0,
  ...obj,
}));


console.log(MY_STATE);

const readbid = async (page, url) => {
  await page.goto(url, { waitUntil: ['load', 'domcontentloaded'] });
  let content = await page.evaluate(sel => {
    const removeWhiteSpace = str => str.replace(/\s+/, '');
    return {
      lotName: removeWhiteSpace(document.querySelector('#divRHS h1').innerHTML),
      bids: parseInt(removeWhiteSpace(document.querySelector(sel).innerHTML), 10),
      desc: removeWhiteSpace(document.querySelector('#divLotBox_1 p').innerHTML),
      timeLeft: Array.from(document.querySelectorAll('#tdTimeleft span')).map(el =>
        removeWhiteSpace(el.innerHTML),
      ),
      currentBid: removeWhiteSpace(document.querySelector('#spnCurrentBid').innerHTML),
      nextBid: removeWhiteSpace(document.querySelector('#tdNextBid').innerHTML),
      bidInputId: '#fmBid',
      lotCloses: removeWhiteSpace(document.querySelector('#tdLotCloses').innerHTML),
    };
  }, '#tdBids');
  return Promise.resolve(Helpers.sanitize(content, { url }));
};

const makeBid = async (url, amount, data) => {
  await page.goto(url, { waitUntil: ['load', 'domcontentloaded'] });
  if (!amount) throw new Error(`No amount to bid on: ${url}`);
  await page.type(data.bidInputId || '#fmBid', amount);
  await page.click('#frmBid input[type="submit"]');
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

const checkLot = async lot => {
  const myRecord = find(MY_STATE, { url: lot.url });
  if (isString(myRecord.maxMid)) {
    console.log(
      colors.yellow(`${myRecord.maxMid} is a string. Make it a number! Aborting.`),
    );
    return await Promise.resolve(myRecord);
  }
  if (lot.currentBid > myRecord.myLastBidAmount && lot.nextBid > myRecord.maxMid) {
    console.log(
      colors.red(
        `trying to bid ${lot.nextBid} on ${lot.desc}.  Will NOT bid because max bid is: ${
          myRecord.maxMid
        }`,
      ),
    );
  } else if (lot.currentBid > myRecord.myLastBidAmount) {
    //DO BID
    //await makeBid(lot.url, lot.nextBid)
    myRecord.myLastBidAmount = lot.nextBid;
    console.log(colors.green(`Bid ${lot.nextBid} on ${lot.desc}`));
  }
  await Promise.resolve(myRecord);
};

const watchBidLoop = async page => {
  const allBids = await Bluebird.map(INPUT_DATA, ({ url }) => readbid(page, url), {
    concurrency: 1,
  });
  console.log('Got all bids');
  const checkAndMakeBids = await Bluebird.map(allBids, lot => checkLot(lot), {
    concurrency: 1,
  });
  setTimeout(function() {
    writeSave(MY_STATE);
    watchBidLoop(page);
  }, WATCH_INTERVAL);
};

const beginScrape = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  console.log('Logged in');

  watchBidLoop(page);

  /*let Bids = await Promise.all(urls.map(async url => await readbid(page, url)));*/
  /*allBids.forEach(bid => {
    console.log(bid);
    console.log('\n');
    fs.writeFileSync(
      path.join(FINAL_OUTPUT, `${bid.lotName}.json`),
      JSON.stringify(bid, null, 4),
    );
  });*/
  //process.exit();
  /*await page.goto(LOGIN, { waitUntil: ['load', 'domcontentloaded'] });
  const usernaneSelector = '#fmUsername';
  await page.waitForSelector(usernaneSelector);
  await page.type(usernaneSelector, process.env.USERNAME);
  const passwordSelector = '#fmPassword';
  await page.type(passwordSelector, process.env.PASSWORD);
  await page.click('.tblForm input[type="submit"]');
  await page.waitForSelector('#divLoggedIn');
  const content = await page.content();
  console.log(content);*/
};

if (!IS_OFFLINE) {
  beginScrape();
}
