// TODO:
//  add the flexibility of reading play_interval from site API: http://api.novascotiawebcams.com/api/image_profile/ferryterminal


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

    urls: Array<string> = [];
    last_fetch_timestamp: number = 0;


    constructor(parent: HTMLElement, camera_name: string) {
        this.parentElem = parent;

        this.title_child = document.createElement('H1');
        this.title_child.appendChild(document.createTextNode(camera_name));
        this.parentElem.appendChild(this.title_child);

        this.img_child = document.createElement('img');
        this.parentElem.appendChild(this.img_child);

        // sample URL below:
        // http://api.novascotiawebcams.com/api/image_profile/ferryterminal/images
        this.apiUrlBase = ImagePlayer.URLAPIBASE + camera_name + '/images';
    }

    start() {
        // Fetching from current time minus the delay in source, minus the length of buffer.
        //this.last_fetch_timestamp = new Date().getTime() / 1000;
        //this.fetchImages(this.last_fetch_timestamp - ImagePlayer.source_delay - ImagePlayer.buffer_seconds, true); // true to kick off refreshing
        //console.log('fetching from ' + (this.last_fetch_timestamp - ImagePlayer.buffer_seconds) + ' with current timestamp:' + this.last_fetch_timestamp);
        this.fetchImages('Start timers');
    }

    stop() {
        clearTimeout(this.timerRefreshImage);
    }

    refreshImage() {
        console.log('Refreshing, ' + this.urls.length + ' in buffer');
        this.img_child.setAttribute('src', this.urls.shift());

        // If we are running close to our buffer, fetch again.
        if (this.urls.length <= (ImagePlayer.BUFFER_SECONDS / ImagePlayer.PLAY_INTERVAL)) {
            this.fetchImages();
        }
    }

    fetchImages(startTimers?: string) {

        // Sample URL below.
        // http://api.novascotiawebcams.com/api/image_profile/ferryterminal/images?absolute_timestamp=1465262275&period=30&speed=1&thumbnail=0
        // http://api.novascotiawebcams.com/api/image_profile/ferryterminal/images?relative_timestamp=30&period=30&speed=1&thumbnail=0
        var apiUrl: string;
        if (this.last_fetch_timestamp === 0) {
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
                        // Parse the json result and populate the URLs
                        console.log('index ' + idx + ' for ' + JSON.stringify(img));    
                        self.urls.push(img.url);

                        // Update with serverside timestamp
                        self.last_fetch_timestamp = img.timestamp;
                    })
                });
                console.log('size of current urls:' + self.urls.length.toString());


                if (startTimers==='Start timers') {
                    // This is the initial fetch, update image src immediately and kick off timer.
                    self.img_child.setAttribute('src', self.urls.shift());
                    self.timerRefreshImage = setInterval(() => self.refreshImage(), ImagePlayer.PLAY_INTERVAL * 1000);
                    console.log('refreshing started');
                }
            }
        });
    }
}

window.onload = () => {
    var content = document.getElementById('content');
    var player = new ImagePlayer(content, 'ferryterminal');
    player.start();
};