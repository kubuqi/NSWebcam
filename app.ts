// TODO:
//  add the flexibility of reading play_interval from site API: http://api.novascotiawebcams.com/api/image_profile/ferryterminal

// Structure to hold an image.
interface Image {
    elem: HTMLElement;
    url: string;
    timestamp: number;
}


class ImagePlayer {

    // Some static configures
    static urlAPIbase: string = 'http://api.novascotiawebcams.com/api/image_profile/';
    static buffer_seconds: number = 10;     // 10 seconds of buffer.
    static play_interval: number = 2;       // 2 seconds per frame.
    static source_delay: number = 70;      // image source appears to have ~ 60 seconds delay from real time

    parentElem: HTMLElement;
    childElem: HTMLElement;

    apiUrl: string;
    timerRefreshImage: number = 0;

    imgBuffer: Array<HTMLElement> = [];
    last_fetch_timestamp: number = 0;



    constructor(parent: HTMLElement, camera_name: string) {
        this.parentElem = parent;
        this.childElem = document.createElement('img');
        this.parentElem.appendChild(this.childElem);

        // samle URL below:
        // http://api.novascotiawebcams.com/api/image_profile/ferryterminal/images
        this.apiUrl = ImagePlayer.urlAPIbase + camera_name + '/images';
    }

    start() {
        // Fetching from current time minus the delay in source, minus the length of buffer.
        this.last_fetch_timestamp = new Date().getTime() / 1000;
        this.fetchImages(this.last_fetch_timestamp - ImagePlayer.source_delay - ImagePlayer.buffer_seconds, true); // true to kick off refreshing
        console.log('fetching from ' + (this.last_fetch_timestamp - ImagePlayer.buffer_seconds) + ' with current timestamp:' + this.last_fetch_timestamp);
    }

    stop() {
        clearTimeout(this.timerRefreshImage);
    }

    refreshImage() {
        console.log('Refreshing, ' + this.imgBuffer.length + ' in buffer');
        var newChildElem: HTMLElement = this.imgBuffer.shift();
        this.parentElem.replaceChild(newChildElem, this.childElem);
        this.childElem = newChildElem;

        // If we are running close to our buffer, fetch again.
        if (this.imgBuffer.length <= (ImagePlayer.buffer_seconds / ImagePlayer.play_interval)) {
            this.fetchImages(this.last_fetch_timestamp, false);
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
                $.each(result, function (index, images) {
                    console.log('Fetched ' + images.length);
                    $.each(images, function (idx, img) {
                        console.log('index ' + idx + ' for ' + JSON.stringify(img));
                        // Parse the json result
                        var url: string = img.url;
                        var timestamp: number = img.timestamp;

                        var elem: HTMLElement = document.createElement('img');
                        elem.setAttribute('src', url);
                        
                        console.log(elem);
                        self.imgBuffer.push(elem);

                        //// Update with serverside timestamp
                        self.last_fetch_timestamp = img.timestamp;
                    })
                });
                console.log('size of current urls:' + self.imgBuffer.length.toString());

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