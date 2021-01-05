import { DashboardImage } from './dashboard-image.model';
import { Deserializable } from './deserializable.interface';
import { Utils } from '../utils/utils';

export interface IDashboardModel {
    id?: string;
    dashboardTitle?: string;
    images?: Array<any>;
    htmlImages?: Array<any>;
    openUrl?: string;
    errorMessage?: string;
    lastRefreshed?: Date;
}

export class DashboardModel implements Deserializable {
    id: string;
    dashboardTitle: string | undefined;
    images: Array<any> | undefined;
    htmlImages: Array<any> | undefined;
    openUrl: string | undefined;
    errorMessage: string | undefined;
    lastRefreshed: Date | undefined;

    constructor(dashboard: any = {}) {
        this.id = dashboard.id || Utils.GetUnqiueId();
        this.dashboardTitle = dashboard.dashboardTitle || '';
        this.images = dashboard.images || [];
        this.htmlImages = dashboard.htmlImages || [];
        this.openUrl = dashboard.openUrl || '';
        this.errorMessage = dashboard.errorMessage || '';
        this.lastRefreshed = dashboard.lastRefreshed || new Date(Date.now());
    }

    static getSample() {
        const maxImages = 10;
        const sampleDashboard = new DashboardModel();
        sampleDashboard.dashboardTitle = "Sample Dashbaord";
        sampleDashboard.lastRefreshed = new Date(Date.now());
        sampleDashboard.id = Utils.GetUnqiueId();
        sampleDashboard.images = [];

        for (let i = 0; i < maxImages; i++) {
            const image = DashboardImage.getSample();
            sampleDashboard.images.push(image);
        }
        return sampleDashboard;
    }

    deserialize(input: any) {
        Object.assign(this, input);
        return this;
    }
}


