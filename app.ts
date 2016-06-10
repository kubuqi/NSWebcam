// TODO:
//  add the flexibility of reading play_interval from site API: http://api.novascotiawebcams.com/api/image_profile/ferryterminal


class ImagePlayer {

    // Some static configures
    static urlAPIbase: string = 'http://api.novascotiawebcams.com/api/image_profile/';
    static buffer_seconds: number = 15;     // seconds of buffer.
    static play_interval: number = 2;       // 2 seconds per frame.
    static source_delay: number = 30;      // image source appears to have ~ 30 seconds delay from real time

    parentElem: HTMLElement;
    childElem: HTMLElement;

    apiUrlBase: string;
    timerRefreshImage: number = 0;

    urls: Array<string> = [];
    last_fetch_timestamp: number = 0;


    constructor(parent: HTMLElement, camera_name: string) {
        this.parentElem = parent;
        this.childElem = document.createElement('img');
        this.parentElem.appendChild(this.childElem);

        // samle URL below:
        // http://api.novascotiawebcams.com/api/image_profile/ferryterminal/images
        this.apiUrlBase = ImagePlayer.urlAPIbase + camera_name + '/images';
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
        this.childElem.setAttribute('src', this.urls.shift());

        // If we are running close to our buffer, fetch again.
        if (this.urls.length <= (ImagePlayer.buffer_seconds / ImagePlayer.play_interval)) {
            this.fetchImages();
        }
    }

    fetchImages(startTimers?: string) {

        // Sample URL below.
        // http://api.novascotiawebcams.com/api/image_profile/ferryterminal/images?absolute_timestamp=1465262275&period=30&speed=1&thumbnail=0
        // http://api.novascotiawebcams.com/api/image_profile/ferryterminal/images?relative_timestamp=30&period=30&speed=1&thumbnail=0
        var apiUrl: string;
        if (this.last_fetch_timestamp === 0) {
            apiUrl = this.apiUrlBase + '?relative_timestamp=' + ImagePlayer.source_delay;
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

                // Start timers if requested
                if (startTimers==='Start timers') {
                    // Start timers on success
                    self.timerRefreshImage = setInterval(() => self.refreshImage(), ImagePlayer.play_interval * 1000);
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