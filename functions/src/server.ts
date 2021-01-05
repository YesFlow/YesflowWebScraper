import { DashboardParseService } from './services/DashboardParseService';
import { chromium } from 'playwright';
const functions = require('firebase-functions');
const cors = require('cors');
const express = require('express');



const imageServer = express();
// Init code that gets run before all request handlers.
imageServer.all('*', async (req, res, next) => {
  res.locals.browser = await chromium.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  next(); // pass control on to router.
});

// imageServer.use(cors({origin: true}));
imageServer.get('*', async (request, response) => {
  functions.logger.info("Hello From DashboardParser!", {structuredData: true});
  const browser = response.locals.browser;
  try {
    const accessToken = request.query.accessToken || request.body.accessToken || "";
    const dashboardId = request.query.dashboardId || request.body.dashboardId || "";

    const context = await browser.newContext();
    const page = await context.newPage();

    // await page.goto("https://www.google.com");
    // await page.waitForTimeout(9000);
    // // You can also take screenshots of pages
    // await page.screenshot({
    //   path: `google_screenshot.png`,
    // });
    // await page.waitForTimeout(5000);
    // await browser.close();

    const dashboardParseService = new DashboardParseService(page);
    console.log('Index: Begin Init');
    await dashboardParseService.initPage(accessToken, dashboardId);
    console.log('Index: End Init');
    console.log('Index: Begin GetDashbaord');
    const returnDashboard = await dashboardParseService.processDashboardImages();
    console.log('Index: End GetDashbaord');

    // Return the data in form of json
    await response.status(200).contentType('application/json').send(returnDashboard);
  } catch (e) {
    response.status(500).send(e.toString());
  }
  await browser.close()
});


module.exports = {
  imageServer
};