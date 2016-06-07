class ImagePlayer {
    parentElem: HTMLElement;
    img: HTMLElement;
    urlAPI: string;
    timerTokenGrab: number;
    timerTokenRefresh: number;
    urls: Array<string>;

    imageIdx: number = 0;

    static urlAPIbase: string = 'http://api.novascotiawebcams.com/api/image_profile/';

    constructor(parent: HTMLElement, camera_name: string) {
        this.parentElem = parent;

        // samle URL below:
        // http://api.novascotiawebcams.com/api/image_profile/ferryterminal/images?absolute_timestamp=1465262275&period=30&speed=1&thumbnail=0
        this.urlAPI = ImagePlayer.urlAPIbase + camera_name + '/images';
        this.img = document.createElement('img');
        this.parentElem.appendChild(this.img);
        this.urls = [
            'http://images.novascotiawebcams.com/ferryterminal/2016/06/07/01/ferryterminal_20160607-011800_w67BepJEEGy6qx5u.jpg', 
            'http://images.novascotiawebcams.com/ferryterminal/2016/06/07/01/ferryterminal_20160607-011802_I55JhjXNOUjqJJ8o.jpg',
            'http://images.novascotiawebcams.com/ferryterminal/2016/06/07/01/ferryterminal_20160607-011804_fAwULTOm9efhJ7uA.jpg',
            'http://images.novascotiawebcams.com/ferryterminal/2016/06/07/01/ferryterminal_20160607-011806_BwjEHx3hqMCJyup5.jpg',
            'http://images.novascotiawebcams.com/ferryterminal/2016/06/07/01/ferryterminal_20160607-011808_WgOrYzZtsGk5YbOG.jpg',
            'http://images.novascotiawebcams.com/ferryterminal/2016/06/07/01/ferryterminal_20160607-011810_vBCjpXpWkjSemCda.jpg',
            'http://images.novascotiawebcams.com/ferryterminal/2016/06/07/01/ferryterminal_20160607-011812_Z0PUJkYSaIT20Gs9.jpg',
            ];
    }

    start() {
        this.grabURLs();
        this.timerTokenRefresh = setInterval(() => this.refreshImage(), 1000);
        this.timerTokenGrab = setInterval(() => this.grabURLs(), 5000);
    }

    stop() {
        clearTimeout(this.timerTokenRefresh);
        clearTimeout(this.timerTokenGrab);
    }

    refreshImage() {
        this.img.setAttribute('src', this.urls[this.imageIdx++]);
        if (this.imageIdx === this.urls.length) {
            this.imageIdx = 0;
        }
    }

    grabURLs() {
        var span = document.createElement('span');
        span.innerHTML = 'grabbing...';
        this.parentElem.appendChild(span);
    }
}

window.onload = () => {
    var content = document.getElementById('content');
    var player = new ImagePlayer(content, 'ferryterminal');
    player.start();
};