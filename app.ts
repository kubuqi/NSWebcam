class ImagePlayer {
    parentElem: HTMLElement;
    img: HTMLElement;
    timerTokenGrab: number;
    timerTokenRefresh: number;
    urls: Array<string>;

    constructor(parent: HTMLElement) {
        this.parentElem = parent;
        this.img = document.createElement('img');
        this.img.setAttribute('src', 'http://images.novascotiawebcams.com/ferryterminal/2016/06/05/14/ferryterminal_20160605-142200_9Mi1w4pWQ9VCRD8L.jpg');
        this.parentElem.appendChild(this.img);
    }

    start() {
        this.grabURLs();
        this.timerTokenRefresh = setInterval(() => this.refresh(), 1000);
        this.timerTokenGrab = setInterval(() => this.grabURLs(), 5000);
    }

    stop() {
        clearTimeout(this.timerTokenRefresh);
        clearTimeout(this.timerTokenGrab);
    }

    refresh() {
        var span = document.createElement('span');
        span.innerHTML = new Date().toUTCString();
        this.parentElem.appendChild(span);
    }

    grabURLs() {
        var span = document.createElement('span');
        span.innerHTML = 'grabbing...';
        this.parentElem.appendChild(span);
    }
}

window.onload = () => {
    var content = document.getElementById('content');
    var player = new ImagePlayer(content);
    player.start();
};