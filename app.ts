// TODO:
//  add the flexibility of reading play_interval from site API: http://api.novascotiawebcams.com/api/image_profile/ferryterminal


// Structure to hold image json from server.
export interface ImageInfo {
    url: string;
    timestamp: number;
    downloaded: boolean;
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

    apiUrlBase: string;
    timerRefreshImage: number = 0;

    imgs: Array<ImageInfo> = [];
    last_fetch_timestamp: number = 0;

    // Use this flag to sync between the completion of ajax and fetchImages() 
    is_fatching: boolean = false;


    constructor(parent: HTMLElement, camera_name: string) {
        this.parentElem = parent;

        this.title_child = document.createElement('H1');
        this.title_child.appendChild(document.createTextNode(camera_name));

        this.img_child = document.createElement('img');
        this.img_child.onload = function () {
            //$(this).fadeIn(400);
            console.log('Loaded image ' + this.src);
        }

        // sample URL below:
        // http://api.novascotiawebcams.com/api/image_profile/ferryterminal/images
        this.apiUrlBase = ImagePlayer.URLAPIBASE + camera_name + '/images';
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
        var img: ImageInfo = this.imgs.shift();

        // Reschedule next refreshing
        this.timerRefreshImage = setTimeout(() => this.refreshImage(), this.imgs[0].timestamp - img.timestamp);

        // Refresh image by updating image source
        this.img_child.setAttribute('src', img.url);
//        $(img).fadeIn(200);

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
            apiUrl = this.apiUrlBase + '?absolute_timestamp=' + this.last_fetch_timestamp;
        }

        console.log('Fetching ' + apiUrl);
        var self = this;
        $.ajax({
            type: 'GET',
            url: apiUrl,
            dataType: 'json',
            success: function (result) {
                $.each(result, function (index, images) {
                    console.log('Fetched ' + images.length);
                    $.each(images, function (idx, img) {
                        // Parse the json result and save into array.
                        self.imgs.push({ url: img.url, timestamp: img.timestamp * 1000, downloaded: img.downloaded });

                        // Update with serverside timestamp
                        self.last_fetch_timestamp = img.timestamp;
                    })
                });
                console.log('size of current urls:' + self.imgs.length.toString());

                // If this is the initial fetch, load one image immediately and then kick off refresh timer.
                if (startTimers === 'Starting') {
                    var img: ImageInfo = self.imgs.shift();
                    self.img_child.setAttribute('src', img.url);
                    self.timerRefreshImage = setTimeout(() => self.refreshImage(), self.imgs[0].timestamp - img.timestamp);
                    console.log('refreshing started');
                }

                // Turn off fetching flag
                self.is_fatching = false;
            },
            error: function () {
                self.is_fatching = false;
            }

        });
    }
}

window.onload = () => {
    var content = document.getElementById('content');
    var ferryterminal = new ImagePlayer(content, 'ferryterminal');
    var pictoulodge = new ImagePlayer(content, 'pictoulodge');
    ferryterminal.start();
    pictoulodge.start();
};