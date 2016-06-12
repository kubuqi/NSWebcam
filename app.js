// TODO:
//  add the flexibility of reading play_interval from site API: http://api.novascotiawebcams.com/api/image_profile/ferryterminal
var ImagePlayer = (function () {
    function ImagePlayer(parent, title, identifier) {
        this.timerRefreshImage = 0;
        this.imgs = [];
        // Use this flag to sync between the completion of ajax and fetchImages() 
        this.is_fatching = false;
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
        };
        // sample URL below:
        // http://api.novascotiawebcams.com/api/image_profile/ferryterminal/images
        this.apiUrlBase = ImagePlayer.URLAPIBASE + identifier + '/images';
    }
    ImagePlayer.prototype.start = function () {
        this.parentElem.appendChild(this.title_child);
        this.parentElem.appendChild(this.img_child);
        this.fetchImages('Starting');
    };
    ImagePlayer.prototype.stop = function () {
        this.parentElem.removeChild(this.title_child);
        this.parentElem.removeChild(this.img_child);
        clearTimeout(this.timerRefreshImage);
    };
    ImagePlayer.prototype.refreshImage = function () {
        var _this = this;
        console.log('Refreshing, ' + this.imgs.length + ' in buffer');
        var img = this.imgs.shift();
        // Reschedule next refreshing. 
        // If there is another image in queue, scheduel according to its timestamp. Otherwise 
        // schedule by default value.
        this.timerRefreshImage = setTimeout(function () { return _this.refreshImage(); }, (this.imgs.length > 0) ? this.imgs[0].timestamp * 1000 - img.timestamp * 1000 : ImagePlayer.PLAY_INTERVAL);
        // Start loading image into shadow
        this.shadow_img.setAttribute('src', img.url);
        //$(this.img_child).fadeIn(500);
        // If we are running close to our buffer, fetch again.
        if (this.imgs.length <= (ImagePlayer.BUFFER_SECONDS / ImagePlayer.PLAY_INTERVAL)) {
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
        if (startTimers === 'Starting') {
            apiUrl = this.apiUrlBase + '?relative_timestamp=' + ImagePlayer.SOURCE_DELAY;
        }
        else {
            apiUrl = this.apiUrlBase + '?absolute_timestamp=' + this.imgs[this.imgs.length - 1].timestamp;
        }
        console.log('Fetching ' + apiUrl);
        var self = this;
        $.ajax({
            type: 'GET',
            url: apiUrl,
            dataType: 'json',
            success: function (result) {
                $.each(result.images, function (index, img) {
                    self.imgs.push({ url: img.url, timestamp: img.timestamp, downloaded: img.downloaded });
                });
                console.log('Loaded urls. size of current urls:' + self.imgs.length);
                // If this is the initial fetch, load one image immediately and then kick off refresh timer.
                if (startTimers === 'Starting') {
                    var img = self.imgs.shift();
                    self.img_child.setAttribute('src', img.url);
                    self.timerRefreshImage = setTimeout(function () { return self.refreshImage(); }, self.imgs[0].timestamp * 1000 - img.timestamp * 1000);
                    console.log('refreshing started');
                }
                // Turn off fetching flag
                self.is_fatching = false;
            },
            error: function () {
                self.is_fatching = false;
            }
        }); // end of ajax
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
    //var ferryterminal = new ImagePlayer(content, 'ferryterminal');
    //var pictoulodge = new ImagePlayer(content, 'pictoulodge');
    //ferryterminal.start();
    //pictoulodge.start();
    // Fetch all camera sites currently failed due to Cross-origin access control
    //$.ajax({
    //    type: 'GET',
    //    //url: 'http://www.novascotiawebcams.com/webcams/cycle/',
    //    //url: 'http://www.novascotiawebcams.com/webcams/json',
    //    dataType: 'json',
    //    crossDomain: true,
    //    success: function (result) {
    //        $.each((<nsw_cycle.RootObject>result).features, function (index, feature) {
    //            var player = new ImagePlayer(content, feature.properties.Title, feature.properties.Identifier);
    //            player.start();
    //        });
    //    },
    //    error: function () {
    //    }
    //}); // end of ajax
    $.getJSON('webcam-list.json', function (result) {
        $.each(result.features, function (index, feature) {
            var player = new ImagePlayer(content, feature.properties.Title, feature.properties.Image);
            player.start();
            console.log('Started ' + feature.properties.Title);
        });
    });
};
//# sourceMappingURL=app.js.map