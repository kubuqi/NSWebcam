// TODO:
//  add the flexibility of reading play_interval from site API: http://api.novascotiawebcams.com/api/image_profile/ferryterminal


class ImagePlayer {

    // Some static configures
    static urlAPIbase: string = 'http://api.novascotiawebcams.com/api/image_profile/';
    static buffer_seconds: number = 10;     // 10 seconds of buffer.
    static play_interval: number = 2;       // 2 seconds per frame.
    static source_delay: number = 70;      // image source appears to have ~ 60 seconds delay from real time

    parentElem: HTMLElement;
    img: HTMLElement;

    apiUrl: string;
    timerRefreshImage: number = 0;

    urls: Array<string> = [];
    timestamp: number = 0;



    constructor(parent: HTMLElement, camera_name: string) {
        this.parentElem = parent;

        // samle URL below:
        // http://api.novascotiawebcams.com/api/image_profile/ferryterminal/images
        this.apiUrl = ImagePlayer.urlAPIbase + camera_name + '/images';

        this.img = document.createElement('img');
        this.parentElem.appendChild(this.img);
    }

    start() {
        // Fetching from current time minus the delay in source, minus the length of buffer.
        this.timestamp = new Date().getTime() / 1000;
        this.fetchImages(this.timestamp - ImagePlayer.source_delay - ImagePlayer.buffer_seconds, true); // true to kick off refreshing
        console.log('fetching from ' + (this.timestamp - ImagePlayer.buffer_seconds) + ' with current timestamp:' + this.timestamp);
    }

    stop() {
        clearTimeout(this.timerRefreshImage);
    }

    refreshImage() {
        console.log('Refreshing, ' + this.urls.length + ' in buffer');
        this.img.setAttribute('src', this.urls.shift());
        // If we are running close to our buffer, fetch again.
        if (this.urls.length <= (ImagePlayer.buffer_seconds / ImagePlayer.play_interval)) {
            this.fetchImages(this.timestamp, false);
        }
    }

    fetchImages(startingTimestamp: number, startTimers?: boolean) {

        // Sample URL below.
        // http://api.novascotiawebcams.com/api/image_profile/ferryterminal/images?absolute_timestamp=1465262275&period=30&speed=1&thumbnail=0
        var apiUrl: string = this.apiUrl + '?absolute_timestamp=' + startingTimestamp.toString();

        console.log('Fetching ' + apiUrl);
        var self = this;
        $.ajax({
            type: 'GET',
            url: apiUrl,
            dataType: 'json',
            success: function (result) {
                console.log('Fetched ' + apiUrl);
                $.each(result, function (index, images) {
                    console.log('Fetched ' + images.length);
                    $.each(images, function (idx, image) {
                        // Collect URLs
                        self.urls.push(image.url);
                        // Update with serverside timestamp
                        self.timestamp = image.timestamp;
                    })
                });
                console.log('size of current urls:' + self.urls.length.toString());

                // Start timers if requested
                if (startTimers) {
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