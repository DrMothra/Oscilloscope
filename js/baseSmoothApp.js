/**
 * Created by DrTone on 08/04/2015.
 */

//Base app for smooth graphing applications
//Colours
var GREEN = '#00ff00', RED = '#ff0000', BLUE = '#0000ff', PURPLE = '#a83dff', YELLOW = '#ffe055', ORANGE = '#ff8d36', WHITE = '#ffffff';

function BaseSmoothApp(container) {
    this.container = container;
    this.startTime = 0;
    this.elapsedTime = 0;
    this.timeSeries = [];
    this.chart = null;
    this.mmPerPixel = 60;
    this.lineWidth = 2;
    this.backgroundColour = '#5c5f64';
    this.waveDelay = 5000;
    this.lineColour = '#000000';
    this.maxScale = 1.3;
    this.minScale = 1.3;
    //Line colours
    this.lineColours = [GREEN, RED, BLUE, PURPLE, YELLOW, ORANGE, WHITE,
        GREEN, RED, BLUE, PURPLE, YELLOW, ORANGE, WHITE];
}

BaseSmoothApp.prototype.setPixelDist = function(pixelDist) {
    this.mmPerPixel = pixelDist;
};

BaseSmoothApp.prototype.setLineWidth = function(lineWidth) {
    this.lineWidth = lineWidth;
};

BaseSmoothApp.prototype.setWaveDelay = function(delay) {
    this.waveDelay = delay;
};

BaseSmoothApp.prototype.init = function() {
    //Set up chart
    this.chart = new SmoothieChart( { grid:{fillStyle: this.backgroundColour, millisPerLine:2000, verticalSections:8},
        millisPerPixel: this.mmPerPixel,
        labels: {disabled: true},
        maxValue: this.maxValue,
        minValue: this.minValue,
        maxValueScale: this.maxScale,
        minValueScale: this.minScale });

    this.container.width = $(this.container).parent().width();
    this.container.height = window.innerHeight*0.8;

    this.chart.streamTo(this.container, this.waveDelay);
};

BaseSmoothApp.prototype.addChannel = function(channelNumber) {
    //Add data to chart
    var series = new TimeSeries();
    this.timeSeries.push(series);
    this.chart.addTimeSeries(series, { lineWidth: this.lineWidth, strokeStyle: this.lineColours[channelNumber] });
};

BaseSmoothApp.prototype.update = function() {
    //Perform any updates

};

BaseSmoothApp.prototype.run = function() {
    var _this = this;
    this.update();
    requestAnimationFrame(function() { _this.run(); });
};
