/**
 * Created by DrTone on 28/09/2014.
 */

//Globals
var MAXY = 35;
var MINY = -40;

function createHorizontalGridLines() {
    //Draw gridlines onto canvas and use as texture
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    //Background colour
    context.fillStyle = "rgba(0, 0, 0, 0.0)";
    //Line colour
    context.strokeStyle = "rgba(0, 0, 0, 1.0)";
    context.lineWidth = 5;
    //Draw lines
    var totalWidth = 300;
    var xStart = 0;
    var yStart = 85;
    var divWidth = 25;
    var divLength = 30;
    context.beginPath();
    context.moveTo(0, 100);
    context.lineTo(totalWidth+0, 100);
    context.closePath();
    context.fill();
    context.stroke();

    context.lineWidth = 1;
    context.beginPath();
    //Create divisions
    for(var i=xStart; i<totalWidth; i+=divWidth) {
        context.moveTo(i, yStart);
        context.lineTo(i, yStart+divLength);
    }
    context.closePath();
    context.fill();
    context.stroke();

    return canvas;
}

function createVerticalGridLines() {
    //Draw gridlines onto canvas and use as texture
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    //Background colour
    context.fillStyle = "rgba(0, 0, 0, 0.0)";
    //Line colour
    context.strokeStyle = "rgba(0, 0, 0, 1.0)";
    context.lineWidth = 10;
    //Draw lines
    var totalHeight = 200;
    var yStart = 5;
    var xStart = 150;
    var divSpacing = 20;
    var divWidth = 80;
    context.beginPath();
    context.moveTo(xStart, yStart);
    context.lineTo(xStart, yStart+totalHeight);
    context.closePath();
    context.fill();
    context.stroke();

    //Create divisions
    context.lineWidth = 1;
    xStart -= (divWidth/2);
    for(var i=yStart; i<totalHeight; i+=divSpacing) {
        context.moveTo(xStart+0.5, i+0.5);
        context.lineTo(xStart+divWidth+0.5, i+0.5);
    }
    context.closePath();
    context.fill();
    context.stroke();

    return canvas;
}

//Init this app from base
function Oscilloscope() {
    BaseApp.call(this);
}

Oscilloscope.prototype = new BaseApp();

Oscilloscope.prototype.init = function(container) {
    BaseApp.prototype.init.call(this, container);
    this.dataStreams = [];
    this.updateRequired = false;
    this.guiControls = null;
    this.dataFile = null;
    this.filename = '';
    this.displayTime = 5;
    this.currentTime = 10;
    this.timeInc = 5;
    this.allSelected = false;
    this.numVisChannels = 0;
    this.autoSep = false;
    this.lastAmp = 1;
    this.totalTime = 0;
    this.periodMS = 20;
    this.totalDelta = 0;
    this.indexPos = 0;
    this.vertexPos = 0;
    this.startTimeOffset = 60.0;
    this.animationSpeed = 0.05;

    this.defaultSampleRate = 32;
    this.defaultSampleTimeMins = 30;
    this.numPoints = this.defaultSampleRate * 60 * this.defaultSampleTimeMins;

    this.numDisplayChannels = 5;
    //Line colours
    this.lineColours = [0x00ff00, 0xff0000, 0x0000ff, 0xA83DFF, 0xFFE055, 0xFF8D36, 0xffffff,
        0x00ff00, 0xff0000, 0x0000ff, 0xA83DFF, 0xFFE055, 0xFF8D36, 0xffffff];
};

Oscilloscope.prototype.update = function() {
    //Perform any updates
    //Update enabled channels
    for(var i=0; i<this.channels.length; ++i) {
        if(this.channels[i].enabled) {
            this.updateChannel(i);
        }
    }

    BaseApp.prototype.update.call(this);
};

Oscilloscope.prototype.updateChannel = function(chanNumber) {
    //Update channel
    var data = this.channel.getLastValue(this.channels[chanNumber].name);
    if(data != undefined) {
        //DEBUG
        console.log('Got data');
        var channelData = this.channels[chanNumber];

        //Adjust play head
        this.dataGroup.scale.x = this.timeScale;
        var delta = this.clock.getDelta();
        this.totalDelta -= delta;

        //Adjust play head
        var dist = (-this.totalDelta) * this.timeScale;
        dist += this.totalDelta;
        this.dataGroup.position.x = this.totalDelta - dist;
        this.playHead = -this.totalDelta;

        //Take starting position into account
        this.dataGroup.position.x += this.startPosition;

        channelData.position[channelData.vertexPos++] = this.playHead;
        channelData.position[channelData.vertexPos++] = data;
        channelData.position[channelData.vertexPos++] = 3;

        updateDisplay(chanNumber+1, data, this.channels[chanNumber].type, this.maxDisplayDigits);
        var limit = this.maxDataValue/this.yScale;
        var boundUpper = data > limit;
        var boundLower = data < -limit;
        if(this.channels[chanNumber].maxBound != boundUpper) {
            updateBoundsIndicator(boundUpper, true, chanNumber+1);
            //DEBUG
            console.log('Indicator updated');
        }
        if(this.channels[chanNumber].minBound != boundLower) {
            updateBoundsIndicator(boundUpper, false, chanNumber+1);
            //DEBUG
            console.log('Indicator updated');
        }
        this.channels[chanNumber].maxBound = boundUpper;
        this.channels[chanNumber].minBound = boundLower;

        if(++channelData.indexPos > channelData.maxIndex) {
            channelData.indexPos = channelData.vertexPos = 0;
            console.log("Buffer rolled over");
        }

        channelData.geometry.offsets = [ {start: 0, count: channelData.indexPos, index: 0} ];
        channelData.geometry.attributes.position.needsUpdate = true;
    }
};

function updateDisplay(channel, data, type, maxDigits) {
    //Update data display
    //Format data
    var elem = $('#streamValue'+channel);
    var digits = getValueRange(data);
    if(digits == null) {
        data = data.toExponential(1);
    } else if(type == 'int') {
        if(digits < maxDigits) {
            //Pad out number
            var pad = (maxDigits-digits)*0.66;
            pad += 'em';
            elem.css('padding-left', pad);
        }
    } else if(type == 'float') {
        if(digits < maxDigits) {
            data = data.toFixed(maxDigits-digits);
        }
    }

    elem.html(data);
}

function updateBoundsIndicator(on_off, up_down, channel) {
    //Update indicators
    var elem = up_down ? $('#indicatorUpStream'+channel) : $('#indicatorDownStream'+channel);
    var image = up_down ? 'images/arrowUp' : 'images/arrowDown';

    image = on_off ? image+'On.png' : image+'.png';

    elem.attr('src', image);
}

Oscilloscope.prototype.createScene = function() {
    //Init base createsScene
    BaseApp.prototype.createScene.call(this);

    //Load background grid
    var gridGeom = new THREE.PlaneGeometry(150, 100);
    var texture = THREE.ImageUtils.loadTexture("images/grid.png");
    var gridMaterial = new THREE.MeshLambertMaterial({ map : texture, transparent: true, opacity: 0.5});
    var grid = new THREE.Mesh(gridGeom, gridMaterial);
    grid.position.y = 0.75;
    grid.position.z = -0.1;
    this.scene.add(grid);

    //Scale lines
    var canvas = createHorizontalGridLines();
    var tex = new THREE.Texture(canvas);
    tex.needsUpdate = true;

    var yHorizOffset = 1.5;
    var linesGeom = new THREE.PlaneGeometry(55, 5);
    var lineMaterial = new THREE.MeshLambertMaterial( {map : tex, transparent: true, opacity: 0.75});
    var hLinesLeft = new THREE.Mesh(linesGeom, lineMaterial);
    hLinesLeft.position.x = -55;
    hLinesLeft.position.y = yHorizOffset;
    var hLinesMid = new THREE.Mesh(linesGeom, lineMaterial);
    hLinesMid.position.y = yHorizOffset;
    var hLinesRight = new THREE.Mesh(linesGeom, lineMaterial);
    hLinesRight.position.x = 55;
    hLinesRight.position.y = yHorizOffset;

    this.scene.add(hLinesLeft);
    this.scene.add(hLinesMid);
    this.scene.add(hLinesRight);

    var planeHeight = 36;
    var yOffset = 8.25;
    var xOffset = -0.9;
    linesGeom = new THREE.PlaneGeometry(planeHeight, 5);
    var redLineMaterial = new THREE.MeshLambertMaterial( {color : 0xff0000} );
    //lineMaterial = new THREE.MeshLambertMaterial( {map : tex, transparent: true, opacity: 0.75});
    var vLinesTop = new THREE.Mesh(linesGeom, lineMaterial);
    vLinesTop.position.x = xOffset;
    vLinesTop.position.y = planeHeight + yOffset;
    vLinesTop.rotation.z = Math.PI/2;

    var vLinesMid = new THREE.Mesh(linesGeom, lineMaterial);
    vLinesMid.position.x = xOffset;
    vLinesMid.position.y = yOffset;
    vLinesMid.rotation.z = Math.PI/2;

    var vLinesBottom = new THREE.Mesh(linesGeom, lineMaterial);
    vLinesBottom.position.x = xOffset;
    vLinesBottom.position.y = -planeHeight + yOffset;
    vLinesBottom.rotation.z = Math.PI/2;

    this.scene.add(vLinesTop);
    this.scene.add(vLinesMid);
    this.scene.add(vLinesBottom);

    var dataGroup = new THREE.Object3D();
    dataGroup.name = 'dataStreams';
    dataGroup.position.x = this.startTimeOffset;
    this.scene.add(dataGroup);
    this.dataGroup = dataGroup;

    this.camera.position.set( 0, 0, 110 );
};

Oscilloscope.prototype.onScaleAmplitude = function(value, changeValue) {
    //Alter output scale
    var inc = 0;
    var scaleFactor = 0.01;
    if(value > changeValue) inc = scaleFactor;
    if(value < changeValue) inc = -scaleFactor;

    var streams = this.scene.getObjectByName('dataStreams');
    if(streams) {
        //streams.scale.y = value > 50 ? Math.pow(value/50, scaleFactor) : Math.pow((100-value)/50, -scaleFactor);
        streams.scale.y += inc;
        if(streams.scale.y <= 0) streams.scale.y = 0.01;
    }
};

Oscilloscope.prototype.onScaleTime = function(value, changeValue) {
    //Adjust time scale
    var inc = 0;
    var scaleFactor = 0.01;
    if(value > changeValue) inc = scaleFactor;
    if(value < changeValue) inc = -scaleFactor;

    var streams = this.scene.getObjectByName('dataStreams');
    if(streams) {
        //streams.scale.y = value > 50 ? Math.pow(value/50, scaleFactor) : Math.pow((100-value)/50, -scaleFactor);
        streams.scale.x += inc;
        if(streams.scale.x <= 0) streams.scale.x = 0.01;
    }
};

Oscilloscope.prototype.onYShift = function(value, changeValue) {
    //Adjust y position of values
    var inc = 0;
    var scaleFactor = 0.1;
    if(value > changeValue) inc = scaleFactor;
    if(value < changeValue) inc = -scaleFactor;

    var dataGroup = this.scene.getObjectByName('dataStreams', true);
    if(dataGroup) {
        dataGroup.position.y += inc;
    }
};

Oscilloscope.prototype.showPreviousTime = function(value) {
    //Forward to next page of data
    if(this.displayTime - this.timeInc < 0) return;

    this.displayTime -= this.timeInc;
    this.currentTime -= this.timeInc;
    var streams = this.scene.getObjectByName('dataStreams');
    if(streams) {
        streams.position.x += this.timeInc;
    }
};

Oscilloscope.prototype.showNextTime = function(value) {
    //Go backward to previous page of data
    if(this.displayTime + this.timeInc > this.currentTime) return;

    this.displayTime += this.timeInc;
    this.currentTime += this.timeInc;
    var streams = this.scene.getObjectByName('dataStreams');
    if(streams) {
        streams.position.x -= this.timeInc;
    }
};

Oscilloscope.prototype.subscribe = function(channelName) {
    //Subscribe to given channel
    this.channel = PubNubBuffer.subscribe(channelName,
        "sub-c-2eafcf66-c636-11e3-8dcd-02ee2ddab7fe",
        1000,
        300);
};


Oscilloscope.prototype.displayStreams = function(streams) {
    //Display data for given channel
    if(streams == null) return;

    //Set up geometry
    //Create buffer for each stream
    this.channels = [];
    var vertices;
    var indices;
    var geometry;
    var positions;
    var lineMat;
    var lineMesh;

    for(var channel=0; channel<streams.length; ++channel) {
        vertices = new Array(this.numPoints*3);
        indices = new Array(this.numPoints);
        for(var t=0; t<this.numPoints; ++t) {
            indices[t] = t;
        }
        geometry = new THREE.BufferGeometry();
        geometry.dynamic = true;
        geometry.addAttribute( 'index', new THREE.BufferAttribute( new Uint16Array(indices), 1 ) );
        geometry.addAttribute( 'position', new THREE.BufferAttribute(new Float32Array(vertices), 3 ) );
        positions = geometry.attributes.position.array;
        geometry.offsets = [ {start: 0, count: this.indexPos, index: 0}];
        lineMat = new THREE.LineBasicMaterial( {color : this.lineColours[channel]} );
        lineMesh = new THREE.Line(geometry, lineMat);
        lineMesh.name = 'lineMesh'+channel;
        lineMesh.frustumCulled = false;
        this.dataGroup.add(lineMesh);
        this.channels.push( {name: '', type: 'float', enabled: true, maxBound: false, minBound: false, geometry: geometry, indexPos: 0, maxIndex: this.numPoints, vertexPos: 0, position: positions } );
    }
};

$(document).ready(function() {
    //Initialise app
    var container = document.getElementById("WebGL-output");
    var app = new Oscilloscope();
    app.init(container);
    app.createScene();
    //app.createGUI();

    //Subscribe to given channel
    app.subscribe(opener.visData.channelName);
    app.displayStreams(opener.visData.streams);

    //GUI Controls
    $('#ampScale').knob({
        stopper : false,
        change : function(value) {
            app.onScaleAmplitude(value, this.cv);
        }
    });

    $('#timeScale').knob({
        change : function(value) {
            app.onScaleTime(value, this.cv);
        }
    });

    $('#yShift').knob({
        change : function(value) {
            app.onYShift(value, this.cv);
        }
    });

    $('#timeBack').on("click", function(evt) {
        app.showPreviousTime();
    });

    $('#timeForward').on("click", function(evt) {
        app.showNextTime();
    });

    app.run();
});