import { Utils } from '../utils/utils';
import { Deserializable } from './deserializable.interface';

interface IDashboardImage {
    id?: string;
    imageTitle?: string;
    imageDataUrl?: string;
    imageExpandUrl?: string;
    imageOpenUrl?: string;
    errorMessage?: string;
    lastRefreshed?: Date;
}

export class DashboardImage implements Deserializable {
    id: string;
    imageTitle: string | undefined;
    imageDataUrl: string;
    imageExpandUrl: string;
    imageOpenUrl: string;
    errorMessage: string | undefined;
    lastRefreshed: Date | undefined;

    constructor(image: any = {}) {
        // console.log('Converting connection to ServiceConnection', connection);
        this.id = image.id || Utils.GetUnqiueId();
        this.imageTitle = image.imageTitle || '';
        this.imageDataUrl = image.imageDataUrl || '';
        this.imageExpandUrl = image.imageExpandUrl || '';
        this.imageOpenUrl = image.imageOpenUrl || '';
        this.lastRefreshed = image.lastRefreshed || new Date(Date.now());
 
    }

    static getSample() {
        const sampleImage = new DashboardImage();
        const uniqueId =  Utils.GetUnqiueId();
        sampleImage.id =uniqueId;
        sampleImage.imageTitle = "Sample Image " + uniqueId;
        sampleImage.imageDataUrl = "http://loremflickr.com/640/480/dog";
        sampleImage.imageExpandUrl = "http://loremflickr.com/640/480/dog";
        sampleImage.imageOpenUrl = "http://loremflickr.com/640/480/dog";
        sampleImage.lastRefreshed = new Date(Date.now());
        return sampleImage;
    }


    deserialize(input: any) {
        Object.assign(this, input);
        return this;
    }
}