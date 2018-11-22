# PPAUCTIONS Bidder/Scraper

### !!! Caution. This has real world effects. Advice for first time use: START_BIDDING=0 and LOGGING=1

[PPAUCTIONS](ppauctions.com) is an aunction site based out of the UK specializing in industry equipment liquidation of asset sales .

This tool provides auto bidding with max bids in mind so you never get outbid unawares.

## Setup

Some knowledge of the command line will be required,

A text editor such Sublime Text, TextWrangler.

### urls.json

`urls.json` is where you will add your lots. See `urls.sample.json`.

These are the options per lot (do not copy, is for reference) :

 ```{
   { "url": "https://www.ppauctions.com/lot.php?l=xxxxxxxx",
    "maxBid": 200 //amount in pounds,
    "startBidNow": false //use the value START_BIDDING_AFTER_X_MINUTES in .env }
 ```



### .env

Duplicate the `.env.sample` and save as `.env` 

Set `USERNAME=my_account_username` and `PASSWORD=my_password`

```OFFLINE=0
LOGGING=0 //terminal log info
WATCH_INTERVAL=6000 //how often to loop through the lot urls
START_BIDDING_AFTER_X_MINUTES=60 // only start bidding when Xmins remains (ignored if startBidNow is set in urls.json)
START_BIDDING=1 //allow bidding
FORCE_MAX_BID=0 //ignore the limit in urls.json
OFFLINE=0 //live on ppauctions.com
```



## Running script

##### Requirments:

- NODEJS 

##### Executing:

- `cd <your local folder>`

- `npm install` or `yarn`

  Make sure all this configured from Setup.

- `node index.js`

  A [chromium]https://github.com/GoogleChrome/puppeteer) window will open and it will begin.

## Hints

#### Bid Credit 

Very important you know your credit before starting the program. Contact them by email to increase.

Active lot biddings  [here](https://www.ppauctions.com/users/lots.php?bidding)

Lots won [here](https://www.ppauctions.com/users/lots.php?won)

The mechanics of the system are as such that 'Lots' close at staggered intervals, but keeping track of your bids can be tough, especially since the observed 'Time Remaining'![](https://i.imgur.com/Ri9OJMU.png) can be misleading - it has been observed to accelerate when there is no activity on the lot. Also 2mins will be added if a bid is in the last 2minutes.



## Images

![](https://i.imgur.com/pNdvVH3.png)

^An active bid.

![](https://i.imgur.com/sjuyXQL.png)

^Zoom in on the high bidder.