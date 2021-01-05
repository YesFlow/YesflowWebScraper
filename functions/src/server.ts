import { DashboardParseService } from './services/DashboardParseService';
import { Browser } from 'puppeteer-core';

const functions = require('firebase-functions');
const express = require('express');
const puppeteer = require('puppeteer');

const PUPPETEER_OPTIONS = {
  headless: true,
  pipe: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--no-first-run',
    '--no-zygote',
    '--headless',
    '--disable-gpu',
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    '--use-file-for-fake-audio-capture=../functions/fakeAudio.mp3',
    '--allow-file-access'
  ],
};

// const PCR = require("puppeteer-chromium-resolver");
// const stats = PCR.getStats(); //or await PCR();

// process.env.PUPPETEER_EXECUTABLE_PATH = stats.executablePath;
// functions.logger.info("ExecutablePath", chromium.executablePath);

// import { chromium } from 'playwright';
const imageServer = express();
// Init code that gets run before all request handlers.

console.log('Launching Chromium');

// imageServer.use(cors({origin: true}));
imageServer.get('*', async (request, response) => {
  functions.logger.info("Hello From DashboardParser!", {structuredData: true});
  const accessToken = request.query.accessToken || request.body.accessToken || "";
  const dashboardId = request.query.dashboardId || request.body.dashboardId || "";

    const browser = await puppeteer.launch(PUPPETEER_OPTIONS).catch(function(error) {
      console.log(error);
    });

    try {
      const dashboardParseService = new DashboardParseService(browser);
      functions.logger.info('Index: Begin Init');
      functions.logger.info('Index: AccessToken ', accessToken);
      functions.logger.info('Index: DashbaordId', dashboardId);
      await dashboardParseService.initPage(accessToken, dashboardId);
      console.log('Index: End Init');
      console.log('Index: Begin GetDashbaord');
      const returnDashboard = await dashboardParseService.processDashboardImages();
      console.log('Index: End GetDashbaord');


      // Return the data in form of json
      await response.status(200).contentType('application/json').send(returnDashboard);
    } catch (e) {
      await response.status(500).send(e.toString());
    }

    try {
      if (browser) {
        browser.close();
      }
    } catch {}

   
});


module.exports = {
  imageServer
};