// TODO:
//  add the flexibility of reading play_interval from site API: http://api.novascotiawebcams.com/api/image_profile/ferryterminal


// JSON types for http://api.novascotiawebcams.com/api/image_profile/ferryterminal/images?relative_timestamp=30&period=30&speed=1&thumbnail=0
declare module nsw_images {

    export interface Image {
        url: string;
        timestamp: number;
        downloaded: boolean;
    }

    export interface RootObject {
        images: Image[];
    }
}


class ImagePlayer {

    // Some static configures
    static URLAPIBASE: string = 'http://api.novascotiawebcams.com/api/image_profile/';
    static BUFFER_SECONDS: number = 15;     // seconds of buffer.
    static PLAY_INTERVAL: number = 2;       // 2 seconds per frame.
    static SOURCE_DELAY: number = 30;      // image source appears to have ~ 30 seconds delay from real time

    parentElem: HTMLElement;
    title_child: HTMLElement;
    img_child: HTMLElement;
    shadow_img: HTMLElement;

    apiUrlBase: string;
    timerRefreshImage: number = 0;

    imgs: Array<nsw_images.Image> = [];

    // Use this flag to sync between the completion of ajax and fetchImages() 
    is_fatching: boolean = false;


    constructor(parent: HTMLElement, title: string, identifier: string) {
        this.parentElem = parent;

        this.title_child = document.createElement('H1');
        this.title_child.appendChild(document.createTextNode(title));

        this.img_child = document.createElement('img');
        this.shadow_img = document.createElement('img');

        var self = this;
        this.shadow_img.onload = function () {
            //$(this).fadeIn(300);
            self.img_child.setAttribute('src', self.shadow_img.getAttribute('src'));
            console.log('Loaded image ' + self.img_child.getAttribute('src'));
        }

        // sample URL below:
        // http://api.novascotiawebcams.com/api/image_profile/ferryterminal/images
        this.apiUrlBase = ImagePlayer.URLAPIBASE + identifier + '/images';
    }

    start() {
        this.parentElem.appendChild(this.title_child);
        this.parentElem.appendChild(this.img_child);

        this.fetchImages('Starting');
    }

    stop() {
        this.parentElem.removeChild(this.title_child);
        this.parentElem.removeChild(this.img_child);
        clearTimeout(this.timerRefreshImage);
    }

    refreshImage() {
        console.log('Refreshing, ' + this.imgs.length + ' in buffer');
        var img = this.imgs.shift();

        // Reschedule next refreshing. 
        // If there is another image in queue, scheduel according to its timestamp. Otherwise 
        // schedule by default value.
        this.timerRefreshImage = setTimeout(() => this.refreshImage(),
                (this.imgs.length > 0) ? this.imgs[0].timestamp*1000 - img.timestamp*1000 : ImagePlayer.PLAY_INTERVAL);

        // Start loading image into shadow
        this.shadow_img.setAttribute('src', img.url);
        //$(this.img_child).fadeIn(500);

        // If we are running close to our buffer, fetch again.
        if (this.imgs.length <= (ImagePlayer.BUFFER_SECONDS / ImagePlayer.PLAY_INTERVAL)) {
            this.fetchImages();
        }
    }

    fetchImages(startTimers?: string) {

        // If there is a fetching going on, skip
        if (this.is_fatching) {
            return;
        }
        this.is_fatching = true;    // will turn off after ajax return.

        // Sample URL below.
        // http://api.novascotiawebcams.com/api/image_profile/ferryterminal/images?absolute_timestamp=1465262275&period=30&speed=1&thumbnail=0
        // http://api.novascotiawebcams.com/api/image_profile/ferryterminal/images?relative_timestamp=30&period=30&speed=1&thumbnail=0
        var apiUrl: string;
        if (startTimers === 'Starting') {
            apiUrl = this.apiUrlBase + '?relative_timestamp=' + ImagePlayer.SOURCE_DELAY;
        } else {
            apiUrl = this.apiUrlBase + '?absolute_timestamp=' + this.imgs[this.imgs.length - 1].timestamp;
        }

        console.log('Fetching ' + apiUrl);
        var self = this;
        $.ajax({
            type: 'GET',
            url: apiUrl,
            dataType: 'json',
            success: function (result) {
                $.each((<nsw_images.RootObject>result).images, function (index, img) {
                    self.imgs.push({ url: img.url, timestamp: img.timestamp, downloaded: img.downloaded });
                });
                console.log('Loaded urls. size of current urls:' + self.imgs.length);

                // If this is the initial fetch, load one image immediately and then kick off refresh timer.
                if (startTimers === 'Starting') {
                    var img = self.imgs.shift();
                    self.img_child.setAttribute('src', img.url);
                    self.timerRefreshImage = setTimeout(() => self.refreshImage(), self.imgs[0].timestamp*1000 - img.timestamp*1000);
                    console.log('refreshing started');
                }

                // Turn off fetching flag
                self.is_fatching = false;
            },
            error: function () {
                self.is_fatching = false;
            }
        }); // end of ajax
    }
}



// JSON types for http://www.novascotiawebcams.com/webcams/cycle/
declare module nsw_cycle {

    export interface Properties {
        Title: string;
        Link: string;
        Identifier: string;
        Category: string;
    }

    export interface Feature {
        type: string;
        properties: Properties;
    }

    export interface RootObject {
        type: string;
        features: Feature[];
    }
}

window.onload = () => {
    var content = document.getElementById('content');
    //var ferryterminal = new ImagePlayer(content, 'ferryterminal');
    //var pictoulodge = new ImagePlayer(content, 'pictoulodge');
    //ferryterminal.start();
    //pictoulodge.start();

    // Fetch all camera sites.
    $.ajax({
        type: 'GET',
//        url: 'http://www.novascotiawebcams.com/webcams/cycle/',
        url: 'http://www.novascotiawebcams.com/webcams/json',
        dataType: 'json',
        crossDomain: true,
        success: function (result) {
            $.each((<nsw_cycle.RootObject>result).features, function (index, feature) {
                var player = new ImagePlayer(content, feature.properties.Title, feature.properties.Identifier);
                player.start();
            });
        },
        error: function () {
        }
    }); // end of ajax


};