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
};

Oscilloscope.prototype.update = function() {
    //Perform any updates
    var delta = this.clock.getDelta();
    var clicked = this.mouse.down;

    //Perform mouse hover
    var vector = new THREE.Vector3(( this.mouse.x / window.innerWidth ) * 2 - 1, -( this.mouse.y / window.innerHeight ) * 2 + 1, 0.5);
    this.projector.unprojectVector(vector, this.camera);

    var raycaster = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize());

    this.hoverObjects.length = 0;
    //this.hoverObjects = raycaster.intersectObjects(this.scene.children, true);

    //Check hover actions
    if(this.hoverObjects.length != 0) {
        for(var i=0; i<this.hoverObjects.length; ++i) {

        }
    }

    if(clicked) {
        var channel = $('#channelNum').val() -1;
        var line = this.scene.getObjectByName('lineMesh'+channel, true);
        if(line) {
            if(line.visible) {
                line.position.y -= (this.mouse.endY - this.mouse.startY)/500;
            }
        }
    }

    this.getData(delta);
    this.dataGroup.position.x -= this.animationSpeed;

    BaseApp.prototype.update.call(this);
};

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

    //Set up data buffers
    //Simulate a float being received at 32Hz
    var cycles = 1000;
    var sampleRate = 32;
    var numPoints = cycles * sampleRate;

    this.vertices = [];
    this.indices = [];
    for(var t=0; t<Math.PI*cycles; t+=(Math.PI/sampleRate)) {
        var y = 10 * Math.sin(t);
        this.vertices.push(0, 0, 0);
    }
    //Create geometry
    //this.indices = new Uint16Array(numPoints);
    this.indices = [];
    for(var i=0; i<numPoints; ++i) {
        this.indices.push(i);
    }
    //this.vertices =  new Float32Array( numPoints*3 );

    this.geometry = new THREE.BufferGeometry();
    this.geometry.dynamic = true;
    this.geometry.addAttribute( 'index', new THREE.BufferAttribute( new Uint16Array(this.indices), 1 ) );
    this.geometry.addAttribute( 'position', new THREE.BufferAttribute(new Float32Array(this.vertices), 3 ) );
    this.geometry.computeBoundingSphere();

    this.positions = this.geometry.attributes.position.array;

    this.geometry.offsets = [ {start: 0, count: this.indexPos, index: 0}];
    var lineMat = new THREE.LineBasicMaterial( {color : 0x00ff00});

    this.lineMesh = new THREE.Line(this.geometry, lineMat);
    this.lineMesh.name = 'lineMesh0';
    this.lineMesh.visible = false;
    this.lineMesh.frustumCulled = false;
    var dataGroup = new THREE.Object3D();
    dataGroup.name = 'dataStreams';
    dataGroup.position.x = this.startTimeOffset;
    dataGroup.add(this.lineMesh);
    this.scene.add(dataGroup);
    this.dataGroup = dataGroup;
};

Oscilloscope.prototype.getData = function(delta) {
    //Simulate getting live data
    this.totalDelta += (delta *1000);
    if(this.totalDelta >= this.periodMS) {
        this.totalTime += Math.PI/32;
        var y = 10 * Math.sin(this.totalTime);
        this.positions[this.vertexPos++] = this.totalTime;
        this.positions[this.vertexPos++] = y;
        this.positions[this.vertexPos++] = 3;
        this.geometry.offsets = [ {start: 0, count: ++this.indexPos, index: 0}];
        //this.lineMesh.geometry.verticesNeedUpdate = true;
        this.geometry.attributes.position.needsUpdate = true;
        this.totalDelta = 0;
    }
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

Oscilloscope.prototype.displayChannel = function(channel) {
    //Display data for given channel
    if(channel < 0) return;

    var line = this.scene.getObjectByName('lineMesh'+channel, true);
    if(line) {
        line.visible = true;
    }
};

function parseParams(param, paramText) {
    //Get channels from input
    //Parse text for required parameters
    param += '=';
    var index = paramText.indexOf(param);
    console.log('Index =', index);
    if(index >= 0) {
        index += param.length;
        var channel = parseInt(paramText.substr(index));
        if(isNaN(channel)) {
            return null
        } else {
            return channel;
        }
    }

    return null;
}

$(document).ready(function() {
    //Initialise app
    var container = document.getElementById("WebGL-output");
    var app = new Oscilloscope();
    app.init(container);
    app.createScene();
    //app.createGUI();

    //Get channel data from input
    var channel = parseParams('channels', window.location.search);
    console.log('Channel =', channel);
    app.displayChannel(channel);

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