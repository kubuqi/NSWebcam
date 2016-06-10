"use strict";
var ImagePlayer = (function () {
    function ImagePlayer(parent, camera_name) {
        this.timerRefreshImage = 0;
        this.imgs = [];
        this.last_fetch_timestamp = 0;
        this.is_fatching = false;
        this.parentElem = parent;
        this.title_child = document.createElement('H1');
        this.title_child.appendChild(document.createTextNode(camera_name));
        this.img_child = document.createElement('img');
        this.img_child.onload = function () {
            console.log('Loaded image ' + this.src);
        };
        this.apiUrlBase = ImagePlayer.URLAPIBASE + camera_name + '/images';
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
        this.timerRefreshImage = setTimeout(function () { return _this.refreshImage(); }, this.imgs[0].timestamp - img.timestamp);
        this.img_child.setAttribute('src', img.url);
        if (this.imgs.length <= (ImagePlayer.BUFFER_SECONDS / ImagePlayer.PLAY_INTERVAL)) {
            this.fetchImages();
        }
    };
    ImagePlayer.prototype.fetchImages = function (startTimers) {
        if (this.is_fatching) {
            return;
        }
        this.is_fatching = true;
        var apiUrl;
        if (startTimers === 'Starting') {
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
                        self.imgs.push({ url: img.url, timestamp: img.timestamp * 1000, downloaded: img.downloaded });
                        self.last_fetch_timestamp = img.timestamp;
                    });
                });
                console.log('size of current urls:' + self.imgs.length.toString());
                if (startTimers === 'Starting') {
                    var img = self.imgs.shift();
                    self.img_child.setAttribute('src', img.url);
                    self.timerRefreshImage = setTimeout(function () { return self.refreshImage(); }, self.imgs[0].timestamp - img.timestamp);
                    console.log('refreshing started');
                }
                self.is_fatching = false;
            },
            error: function () {
                self.is_fatching = false;
            }
        });
    };
    ImagePlayer.URLAPIBASE = 'http://api.novascotiawebcams.com/api/image_profile/';
    ImagePlayer.BUFFER_SECONDS = 15;
    ImagePlayer.PLAY_INTERVAL = 2;
    ImagePlayer.SOURCE_DELAY = 30;
    return ImagePlayer;
}());
window.onload = function () {
    var content = document.getElementById('content');
    var ferryterminal = new ImagePlayer(content, 'ferryterminal');
    var pictoulodge = new ImagePlayer(content, 'pictoulodge');
    ferryterminal.start();
    pictoulodge.start();
};
