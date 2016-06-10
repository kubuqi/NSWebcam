// TODO:
//  add the flexibility of reading play_interval from site API: http://api.novascotiawebcams.com/api/image_profile/ferryterminal
var ImagePlayer = (function () {
    function ImagePlayer(parent, camera_name) {
        this.timerRefreshImage = 0;
        this.urls = [];
        this.last_fetch_timestamp = 0;
        // Use this flag to sync between the completion of ajax and fetchImages() 
        this.is_fatching = false;
        this.parentElem = parent;
        this.title_child = document.createElement('H1');
        this.title_child.appendChild(document.createTextNode(camera_name));
        this.img_child = document.createElement('img');
        this.img_child.onload = function () {
            //$(this).fadeIn(400);
            console.log('Loaded image ' + this.src);
        };
        // sample URL below:
        // http://api.novascotiawebcams.com/api/image_profile/ferryterminal/images
        this.apiUrlBase = ImagePlayer.URLAPIBASE + camera_name + '/images';
    }
    ImagePlayer.prototype.start = function () {
        this.parentElem.appendChild(this.title_child);
        this.parentElem.appendChild(this.img_child);
        // Fetching from current time minus the delay in source, minus the length of buffer.
        //this.last_fetch_timestamp = new Date().getTime() / 1000;
        //this.fetchImages(this.last_fetch_timestamp - ImagePlayer.source_delay - ImagePlayer.buffer_seconds, true); // true to kick off refreshing
        //console.log('fetching from ' + (this.last_fetch_timestamp - ImagePlayer.buffer_seconds) + ' with current timestamp:' + this.last_fetch_timestamp);
        this.fetchImages('Start timers');
    };
    ImagePlayer.prototype.stop = function () {
        this.parentElem.removeChild(this.title_child);
        this.parentElem.removeChild(this.img_child);
        clearTimeout(this.timerRefreshImage);
    };
    ImagePlayer.prototype.refreshImage = function () {
        console.log('Refreshing, ' + this.urls.length + ' in buffer');
        var img = this.img_child;
        img.setAttribute('src', this.urls.shift());
        $(img).fadeIn(400);
        // If we are running close to our buffer, fetch again.
        if (this.urls.length <= (ImagePlayer.BUFFER_SECONDS / ImagePlayer.PLAY_INTERVAL)) {
            this.fetchImages();
        }
    };
    ImagePlayer.prototype.fetchImages = function (startTimers) {
        // If there is a fetching going on, skip
        if (this.is_fatching) {
            return;
        }
        this.is_fatching = true; // will turn off after ajax return.
        // Sample URL below.
        // http://api.novascotiawebcams.com/api/image_profile/ferryterminal/images?absolute_timestamp=1465262275&period=30&speed=1&thumbnail=0
        // http://api.novascotiawebcams.com/api/image_profile/ferryterminal/images?relative_timestamp=30&period=30&speed=1&thumbnail=0
        var apiUrl;
        if (this.last_fetch_timestamp === 0) {
            apiUrl = this.apiUrlBase + '?relative_timestamp=' + ImagePlayer.SOURCE_DELAY;
        }
        else {
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
                    });
                });
                console.log('size of current urls:' + self.urls.length.toString());
                // If this is the initial fetch, load one image and kick off timer.
                if (startTimers === 'Start timers') {
                    self.img_child.setAttribute('src', self.urls.shift());
                    self.timerRefreshImage = setInterval(function () { return self.refreshImage(); }, ImagePlayer.PLAY_INTERVAL * 1000);
                    console.log('refreshing started');
                }
                // Turn off fetching flag
                self.is_fatching = false;
            },
            error: function () {
                self.is_fatching = false;
            }
        });
    };
    // Some static configures
    ImagePlayer.URLAPIBASE = 'http://api.novascotiawebcams.com/api/image_profile/';
    ImagePlayer.BUFFER_SECONDS = 15; // seconds of buffer.
    ImagePlayer.PLAY_INTERVAL = 2; // 2 seconds per frame.
    ImagePlayer.SOURCE_DELAY = 30; // image source appears to have ~ 30 seconds delay from real time
    return ImagePlayer;
}());
window.onload = function () {
    var content = document.getElementById('content');
    var ferryterminal = new ImagePlayer(content, 'ferryterminal');
    var pictoulodge = new ImagePlayer(content, 'pictoulodge');
    pictoulodge.start();
};
//# sourceMappingURL=app.js.map