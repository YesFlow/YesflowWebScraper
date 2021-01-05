
import { BehaviorSubject } from "rxjs";
import { DashboardModel } from '../constants/dashboard.model';
import { DashboardImage } from '../constants/dashboard-image.model';
import { Utils } from '../utils/utils';
import { Browser, Page, Frame, BrowserContext } from 'puppeteer';



export class DashboardParseService {
    public allImages: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);
    public allImagesHtmlContent: BehaviorSubject<any[]> = new BehaviorSubject<any[]>([]);

    public crmDashboardUrlTemplate = '';
    public page: Page;
    public browser: Browser;
    public context: BrowserContext;

    constructor(public browserInstance: Browser) {
        console.log('DashboardParseService: constructor Init');
        this.browser = browserInstance;
    }
    
    async initPage(accessToken: string = '', dashboardId: string = '') {
        console.log('DashboardParseService: Init Page');

        const pagemode="iframe";
        const sitemappath = "SFA%7cMyWork%7cnav_dashboards";
        const crmUrl = "honcho.crm.dynamics.com";
        const crmHomePage = `https://${crmUrl}/main.aspx`;
        this.crmDashboardUrlTemplate = `https://${crmUrl}/workplace/home_dashboards.aspx?sitemappath=`+sitemappath+`&pagemode=${pagemode}&dashboardId=`+dashboardId;    
        console.log('GetDashboardURL',this.crmDashboardUrlTemplate);

        // this.context = await this.browser.defaultBrowserContext();
        this.page =  await this.browser.newPage();
        await this.page.setUserAgent(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36'
          );

          
        await this.page.setViewport({ width: 1280, height: 800 })
        if (accessToken && accessToken.length > 0) {
            const headers = {'Authorization': 'Bearer ' + accessToken};
            await this.page.setExtraHTTPHeaders(headers);
        }
        await this.page.goto(this.crmDashboardUrlTemplate).then(()=>{ return this.page.waitForNavigation({waitUntil: 'networkidle0'})});
        console.log('Begin Wait For VizIframes');
        await this.waitForVizIframes();
        console.log('End Wait For VizIframes');
    }

    async processDashboardImages() {
        // debugger;
        let dashboard = new DashboardModel();  
        const dashboardTitle = await this.getPageTitle();
        dashboard.dashboardTitle = dashboardTitle;
        dashboard.openUrl = this.crmDashboardUrlTemplate;

        const crmGraphDashboardCheck = await this.isCrmChartsDashboard();
        const insightsDashboardCheck = await this.isInsightsDashboard();
        console.log('Is a Insights Dashboard', insightsDashboardCheck);
        console.log('Is a CrmGraph Dashboard', crmGraphDashboardCheck);

        if (insightsDashboardCheck) {
            dashboard = await this.processInsightsDashboard(dashboard);
        } 
        else if (crmGraphDashboardCheck) {    
            dashboard = await this.processCrmGraphDashboard(dashboard);
        } 
        else {
            dashboard.errorMessage = "Dashboard Not Found";
        }
        return dashboard;
    }

    async processInsightsDashboard(dashboard:DashboardModel) {
        try {
            console.log('Index: Begin getInsightFrames');
            const insightFramesContent = await this.getInsightFrameContent();
            console.log('Index: End getInsightFrames', insightFramesContent.length);

            if (insightFramesContent && insightFramesContent.length > 0) {
                dashboard.htmlImages = insightFramesContent;
            }
        } catch{}
        return dashboard;
    }

    async processCrmGraphDashboard(dashboard) {
        try {
            console.log('Index: Begin getChartIFrames');
            await this.waitForVizIframes();
            const chartFrames = this.getChartIFrames();
            console.log('Index: End getChartIFrames', chartFrames);
        
            if (chartFrames && chartFrames.length > 0) {
                console.log('Index: Begin GetChartImages');
                const chartImages = await this.getAllChartImagesFromFrames(chartFrames);
                console.log('Index: End GetChartImages');
        
                if (chartImages && chartImages.length > 0) {
                    dashboard.images = chartImages;
                }
            }
        } catch{}

        return dashboard;
    }

    // Insights Dashboards are special and use different graph selectors
    async isInsightsDashboard() {
        let isInsights = false;
        const selector = await this.page.$$('.ms-crm-Custom');
        isInsights = selector && selector.length > 0;
        return isInsights;
    }

    async isCrmChartsDashboard() {
        let isInsights = false;
        const selector = this.getChartIFrames();
        isInsights = selector && selector.length > 0;
        return isInsights;
    }
    
    async waitForVizIframes() {
        const watchdog = this.page.waitForFunction(() => {
            return document.querySelectorAll('*[id$="_vizIframe"]').length > 0;
        });
        return await watchdog;
    }

    async waitForDashboardIframes() {
        await this.page.waitForSelector('.dashboardBodyContainer');
    }

    async getPageTitle() {
        let title = '';
        try {
            const pageSelect = await this.page.$('*[id$="dashboardSelectorContainer"]');
            const titleValue = await pageSelect.getProperty('title');
            title = titleValue.toString();
            return title;
        } catch {}

        return title;
    }

    getDashboardSample() : DashboardModel {
        return DashboardModel.getSample();
    }

    isValidFrameNameForCharts(frameName: string) {
        let isValid = false;

        if (frameName.indexOf('_vizIframe')>-1) {
            isValid = true;
        }

        if (frameName.indexOf('dashboardFrame')>-1) {
            isValid = true;
        }

        return isValid;
    }

    getChartIFrames() {
        return this.page
            .frames()
            .filter((frame:any)=>{
             return this.isValidFrameNameForCharts(frame.name())})
            .map((x:any)=>x.name());
    }

    async getInsightFrameContent() {
        const selectorText = '.ms-crm-Custom';

        await this.page.waitForSelector(selectorText);
        const selector = await this.page.$$(selectorText);
        
        const getContentFromContentFrame = async (contentFrame) => {
            return await contentFrame.content();
        };

        const getContentFrame = async (frame)=> {
            return await frame.contentFrame();
        };

        const getContent = async (element) => {
            const frameContent = await getContentFrame(element);
            const content = await getContentFromContentFrame(frameContent);
            return content;
        };

        const getAllFrameContent = async (selectframes:any[]) => {
            const frameArray = [];
            for (const selectFrame of selectFrames) {
                try {
                    const frame:Frame = this.page.frames().find(x=>x.name() === selectFrame);
                    // const frameContentHtml = await getContent(frame);
                    await frame.waitForNavigation();
                    // await frame.$('.highcharts-container');
                    // await frame.$('svg');
                    const chartOutputPath = `GetDashboardImages/output/${Utils.GetUnqiueId()}.png`;
                    const imageBuffer = await this.page.screenshot({ path: chartOutputPath, type: 'png', fullPage: false });

                    const chartOutputPng = "data:image/png;base64," + imageBuffer.toString('base64');
                    frameArray.push(chartOutputPng);
                } catch {}
            }
            return frameArray;
        }
        const selectFrames=this.page.frames().map((frame)=>frame.name()).filter(x=>x.length > 0);
        const allFrameContentArray = await getAllFrameContent(selectFrames);

        return allFrameContentArray;
    }

    async getAllChartImagesFromFrames(frameNameArray:any[]) {
        const localImages:any = [];
        for (const frameName of frameNameArray) {
            console.log('DashboardParseService: GetAllChartImagesFromFrames Processing Begin', frameName);
            
            const frameReference:Frame = this.page.frames().find(x=>x.name() === frameName);
            if (frameReference) {
                console.log('DashboardParseService: GetAllChartImagesFromFrames WaitForFrameLoad Begin', frameName);
                await frameReference.waitForSelector('#CrmChart');
                console.log('DashboardParseService: GetAllChartImagesFromFrames WaitForFrameLoad End', frameName);

                const frameContent = await frameReference.content()
                const chartImage = this.parseImageFromChart(frameContent);
                localImages.push(chartImage);
                console.log('DashboardParseService: GetAllChartImagesFromFrames Processing End', frameName);
            } else {
                console.log('DashboardParseService: GetAllChartImagesFromFrames Processing End FrameNotFound', frameName);
            }
        }
        this.allImages.next(localImages);
        console.log('DashboardParseService: GetAllChartImagesFromFrames End', this.allImages.value);
        return this.allImages.value;
    }
    
    parseImageFromChart(chart: string): DashboardImage {
        let chartImage: DashboardImage = new DashboardImage();
        try {
            const fullImageRegex =/<img*.src=\"(data:image\/([a-zA-Z]*);base64,([^\"]*))\"*.id=\"([a-zA-Z]*)" alt=\"(.+)\"/;
            const altRegex = /alt=\"(.*?)\"/

            const isImageTag = fullImageRegex.test(chart);
            // debugger;
            if (isImageTag) {
                const imageMatch = fullImageRegex.exec(chart);
                const imageDataUrl = (imageMatch && imageMatch.length>0) ? imageMatch[1] : '';
                const imageTag = (imageMatch && imageMatch.length) ? imageMatch[0] : '';
                const titleMatches =  altRegex.exec(imageTag);
                const imageTitle = (titleMatches && titleMatches.length > 0) ? titleMatches[1] : '';
                chartImage = new DashboardImage({imageTitle, imageDataUrl, imageOpenUrl: this.crmDashboardUrlTemplate });
                chartImage.imageExpandUrl = "expandImage('" + chartImage.id + "')";
                return chartImage;
            } else {
                return chartImage;
            }
        } catch(error) {
            console.error(error);
            return chartImage;
        }
    }
}


