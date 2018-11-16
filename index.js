require('dotenv').config();
const puppeteer = require('puppeteer');
const Bluebird = require('bluebird');
let date = require('date-and-time');
let mkdirp = require('mkdirp');
let now = new Date();
const time = date.format(now, 'YYYY_MM_DD_HH_mm_ss');
const path = require('path');
const fs = require('fs');
const urls = JSON.parse(fs.readFileSync('urls.json'));
const LOGIN = 'https://www.ppauctions.com/users/login.php';
const OUTPUT = 'output';
const FINAL_OUTPUT = path.join(OUTPUT, time);
mkdirp.sync(FINAL_OUTPUT)

const readbid = async (page, url) => {
  await page.goto(url, { waitUntil: ['load', 'domcontentloaded'] });
  let content = await page.evaluate(sel => {
    const removeWhiteSpace = str => str.replace(/\s+/, '');
    return {
      lotName: removeWhiteSpace(document.querySelector('#divRHS h1').innerHTML),
      bids: parseInt(removeWhiteSpace(document.querySelector(sel).innerHTML), 10),
      desc: document.querySelector('#divLotBox_1 p').innerHTML,
      timeLeft: Array.from(document.querySelectorAll('#tdTimeleft span')).map(
        el => el.innerHTML,
      ),
      nextBid: removeWhiteSpace(document.querySelector('#tdNextBid').innerHTML),
      bidInputId: '#fmBid',
      lotCloses: removeWhiteSpace(document.querySelector('#tdLotCloses').innerHTML),
    };
  }, '#tdBids');
  return Promise.resolve(content);
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

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  console.log('Logged in');
  //const bid = await readbid(page, urls[0]);
  //console.log(bid);
  const allBids = await Bluebird.map(urls, url => readbid(page, url), { concurrency: 1 });
  /*let Bids = await Promise.all(urls.map(async url => await readbid(page, url)));*/
  allBids.forEach(bid => {
    fs.writeFileSync(
      path.join(FINAL_OUTPUT, `${bid.lotName}.json`),
      JSON.stringify(bid, null, 4),
    );
  });
  process.exit();
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
})();

// puppeteer
//   .launch()
//   .then(function(browser) {
//     return browser.newPage()
//   })
//   .then(function(page) {
//     return Promise.all(
//       urls.map(url => {
//         return page
//           .goto(url)
//           .then(function() {
//             return page.content()
//           })
//           .then(function(html) {
//             console.log(html);
//             /*return $("#tdBids", html).each(function() {
//               return { url, bid: $(this).text() }
//             })*/
//           })
//       })
//     )
//   })
//   .then(results => {
//     console.log(results)
//   })
