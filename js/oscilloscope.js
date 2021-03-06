/**
 * Created by atg on 06/08/2014.
 */

//Globals
var MAXY = 35;
var MINY = -40;
var MAX_CONNECTION_ATTEMPTS = 10;

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

function getValueRange(number) {
    //Determine how many digits in number
    var digits = 1;
    var range = 10;
    var maxRange = 1000000;
    var rangeFound = false;
    //Take negative numbers into account
    if(number < 0) number *= -1;

    if(number >= maxRange) return null;

    while(!rangeFound) {
        if(number < range) {
            rangeFound = true;
        } else {
            ++digits;
            range *= 10;
        }
    }

    return digits;
}
//Init this app from base
function Oscilloscope(container) {
    BaseSmoothApp.call(this, container);
}

Oscilloscope.prototype = new BaseSmoothApp();

Oscilloscope.prototype.init = function() {
    BaseSmoothApp.prototype.init.call(this);
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
    this.playHead = 0;
    this.startTimeOffset = 60.0;
    this.animationSpeed = 0.05;

    this.iterations = 0;

    this.maxDisplayDigits = 7;
    this.gridVisible = true;
    this.scaleVisible = true;
    this.yScale = 1;
    this.maxDataValue = 100;
    this.maxScaleFactorValue = 5000;
    this.maxValueRetrieved = -10000000;
    this.controlScale = 90000;
    this.scaleFactorAmp = 0.01;
    this.scaleFactorYShift = 10.0;

    this.channels = [];

    this.deltaScale = 2;
    this.timeScale = 1;
    this.numStreams = 14;
    for(var i=0; i<this.numStreams; ++i) {
        this.channels.push( { name: '', type: 'float', enabled: false, maxBound: false, minBound: false } );
        this.addChannel(i);
    }
    //Pubnub data
    this.subscribed = false;
    this.channelName = null;
    this.connectionAttempts = 0;

    this.startPosition = 150;

    this.numDisplayChannels = 14;
    this.channelNames = [];
};

Oscilloscope.prototype.update = function() {
    //Perform any updates

    //var clicked = this.mouse.down;

    //Perform mouse hover
    /*
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
    */

    //Update enabled channels
    if(this.subscribed) {
        for(var i=0; i<this.channelNames.length; ++i) {
            if(this.channels[i].enabled) {
                this.updateChannel(i);
            }
        }
    }

    BaseSmoothApp.prototype.update.call(this);
};

Oscilloscope.prototype.createScene = function() {
    //Init base createsScene

    //Load background grid
    /*
    var width = 420;
    var height = (2*width)/3;
    var gridGeom = new THREE.PlaneGeometry(width, height);
    var texture = THREE.ImageUtils.loadTexture("images/grid.png");
    var gridMaterial = new THREE.MeshLambertMaterial({ map : texture, transparent: true, opacity: 0.5});
    var grid = new THREE.Mesh(gridGeom, gridMaterial);
    grid.name = 'grid';
    grid.position.y = 0;
    grid.position.z = -0.1;
    this.scene.add(grid);

    //Scale lines
    var scaleGroup = new THREE.Object3D();
    scaleGroup.name = 'scaleGroup';
    var canvas = createHorizontalGridLines();
    var tex = new THREE.Texture(canvas);
    tex.needsUpdate = true;

    var yHorizOffset = 0.75;
    var horizGridScale = 1;
    var linesGeom = new THREE.PlaneGeometry(125, 5);
    var lineMaterial = new THREE.MeshLambertMaterial( {map : tex, transparent: true, opacity: 0.75});
    var hLinesLeft = new THREE.Mesh(linesGeom, lineMaterial);
    hLinesLeft.scale.x = horizGridScale;
    hLinesLeft.position.x = -125;
    hLinesLeft.position.y = yHorizOffset;
    var hLinesMid = new THREE.Mesh(linesGeom, lineMaterial);
    hLinesMid.scale.x = horizGridScale;
    hLinesMid.position.y = yHorizOffset;
    var hLinesRight = new THREE.Mesh(linesGeom, lineMaterial);
    hLinesRight.scale.x = horizGridScale;
    hLinesRight.position.x = 125;
    hLinesRight.position.y = yHorizOffset;

    scaleGroup.add(hLinesLeft);
    scaleGroup.add(hLinesMid);
    scaleGroup.add(hLinesRight);

    var planeHeight = 70;
    var yOffset = 0;
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

    scaleGroup.add(vLinesTop);
    scaleGroup.add(vLinesMid);
    scaleGroup.add(vLinesBottom);
    this.scene.add(scaleGroup);
    */

    //Set up data buffers
    //Simulate a float being received at 32Hz
    //For 30 minutes
    /*
    var sampleRate = 32;
    var numPoints = 60 * sampleRate * 30;

    //Create buffer for each stream
    this.channels = [];
    var vertices;
    var indices;
    var geometry;
    var positions;
    var lineMat;
    var lineMesh;
    var dataGroup = new THREE.Object3D();
    dataGroup.name = 'dataStreams';

    for(var channel=0; channel<this.numStreams; ++channel) {
        vertices = new Array(numPoints*3);
        indices = new Array(numPoints);
        for(var t=0; t<numPoints; ++t) {
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
        dataGroup.add(lineMesh);
        this.channels.push( {name: '', type: 'float', enabled: false, maxBound: false, minBound: false, geometry: geometry, indexPos: 0, maxIndex: numPoints, vertexPos: 0, position: positions } );
    }

    this.scene.add(dataGroup);
    this.dataGroup = dataGroup;
    */

    //Test
    /*
    var boxGeom = new THREE.BoxGeometry(2, 2, 2);
    var boxMat = new THREE.MeshLambertMaterial( {color: 0xff0000});
    var box = new THREE.Mesh(boxGeom, boxMat);
    var box2 = new THREE.Mesh(boxGeom, boxMat);
    box2.position.x = 150;
    box2.position.y = 5;
    var head = 150;
    var delta = 20;
    var scale = 1;


    var boxGroup = new THREE.Object3D();
    boxGroup.add(box);

    //head += delta;
    boxGroup.scale.x = scale;
    var dist = ((head + delta) * scale) - delta;
    var offset = (dist - head)/scale;
    box.position.x = head + delta - offset;
    boxGroup.position.x = -delta;


    this.scene.add(boxGroup);
    this.scene.add(box2);
    */
    /*
    var boxGeom = new THREE.BoxGeometry(2, 2, 2);
    var boxMat = new THREE.MeshLambertMaterial( {color: 0xff0000});
    var box = new THREE.Mesh(boxGeom, boxMat);
    box.position.y = 100;
    this.scene.add(box);
    */
};

/*
Oscilloscope.prototype.generateData = function() {
    //Generate 3 forms of data for now
    //Power data, sine wave and square wave

    //Create main data group
    var dataGroup = new THREE.Object3D();
    dataGroup.name = 'dataStreams';
    dataGroup.position.x = -139;

    var powerData = [
            0.0329, 0.0329, 0.0329, 0.0329, 0.0329, 0.0329, 0.0329, 0.0329, 0.0329, 0.0329, 0.0329, 0.0331, 0.0329, 0.0329, 0.0330, 0.0329, 0.0331, 0.0330, 0.0329, 0.0329, 0.0329, 0.0329, 0.0329,
            0.0330, 0.0329, 0.0329, 0.0329, 0.0329, 0.0329, 0.0329, 0.0329, 0.0330, 0.0330, 0.0329, 0.0332, 0.0330, 0.0329, 0.0329, 0.0329, 0.0329, 0.0329, 0.0329, 0.0330, 0.0330, 0.0329, 0.0329,
            0.0329, 0.0329, 0.0329, 0.0329, 0.0329, 0.0329, 0.0329, 0.0329, 0.0329, 0.0329, 0.0329, 0.0329, 0.0000, 0.8711, 1.1362, 1.1589, 1.2478, 1.7158, 2.1584, 2.2554, 2.3640, 2.2141, 2.2250,
            2.1545, 1.1378, 0.3860, 0.3771, 0.3744, 0.4372, 0.3749, 1.8901, 1.0776, 0.4536, 0.3881, 0.3899, 0.4645, 0.3932, 0.4158, 0.4377, 0.5163, 0.4288, 0.4958, 0.7344, 2.3490, 2.2085, 2.0516,
            2.2232, 2.1828, 1.1408, 0.7368, 0.6475, 0.6479, 0.7155, 0.6515, 2.4879, 2.7762, 1.1129, 0.3949, 0.6432, 1.6976, 2.1596, 2.1476, 1.8797, 2.1867, 2.1653, 1.7253, 1.7613, 1.9513, 2.0614,
            2.0489, 2.1170, 2.0936, 0.6406, 0.4712, 0.3911, 0.3904, 0.3876, 0.7043, 2.5218, 2.8371, 2.5790, 2.5262, 1.0964, 1.6412, 2.0258, 1.9027, 1.9126, 1.9263, 1.9027, 2.2263, 2.1743, 2.0768,
            2.1444, 1.9689, 2.1371, 2.1816, 1.4244, 0.5518, 0.4155, 0.4593, 0.3891, 0.3888, 0.8134, 0.4656, 0.3976, 0.3933, 0.4190, 0.4849, 0.4304, 0.4358, 1.4951, 2.1280, 2.1574, 2.0877, 1.9540,
            2.3769, 2.2760, 2.3386, 2.2760, 2.3076, 1.2891, 0.3751, 0.3458, 0.3964, 0.3236, 0.3253, 0.3977, 0.3376, 0.3785, 1.6931, 0.4294, 0.4063, 0.3606, 1.5392, 2.1607, 2.1394, 1.7724, 2.2001,
            2.2581, 1.9968, 2.1858, 2.0120, 2.2365, 2.1400, 0.5120, 0.3368, 0.3987, 0.3233, 0.3258, 0.3236, 2.3807, 2.7362, 1.0303, 0.3346, 0.4104, 1.3495, 1.4307, 1.3636, 1.2244, 1.1949, 1.2497,
            1.1984, 1.2344, 2.1114, 2.2519, 2.0986, 2.2903, 2.1407, 0.6691, 0.3518, 0.4048, 0.3367, 0.3418, 0.3414, 2.1080, 1.1046, 0.3681, 0.4140, 0.4125, 0.3949, 0.3839, 0.4610, 0.4089, 0.4539,
            0.4371, 0.5539, 0.8939, 2.0585, 2.1617, 2.1827, 2.2715, 2.2351, 0.6489, 0.4668, 0.3855, 0.3879, 0.3885, 0.4497, 2.5255, 3.1502, 2.5336, 2.5994, 2.5236, 2.6793, 2.7687, 2.7118, 2.3138,
            1.6330, 0.6998, 0.6096, 0.6962, 2.0262, 2.3341, 2.1656, 2.2563, 2.2236, 0.6263, 0.3815, 0.3670, 0.4337, 0.3653, 0.3671, 2.3796, 2.9905, 0.8920, 0.3744, 0.6546, 1.7923, 2.2390, 2.1567,
            1.9469, 2.2097, 2.1531, 2.1481, 2.2534, 2.2205, 2.4569, 2.4377, 2.3176, 2.9583, 0.8349, 0.4439, 0.4917, 0.4318, 0.4258, 0.4221, 0.6607, 2.3115, 0.4398, 0.5203, 0.4610, 0.4522, 0.6811,
            1.7980, 1.2668, 1.1961, 1.6077, 2.1651, 2.2652, 2.1506, 2.2442, 2.1509, 2.2345, 2.2478, 1.8025, 0.5443, 0.4471, 0.3878, 0.3827, 0.3808, 1.2784, 2.6011, 0.3955, 0.4733, 0.4013, 0.3989,
            0.4152, 1.2366, 2.0034, 2.1759, 2.0914, 2.2522, 2.1968, 2.1530, 2.2092, 2.1523, 2.2242, 2.2244, 1.2789, 0.5144, 0.4323, 0.3784, 0.3709, 0.4308, 0.3691, 1.8126, 2.5728, 1.9389, 0.3844,
            0.4156, 1.4980, 2.5162, 2.0488, 2.2455, 2.1235, 2.0922, 2.0814, 1.9812, 2.0693, 1.9733, 2.1310, 2.0202, 0.3702, 0.4249, 0.3331, 0.3387, 0.3362, 0.4022, 1.8302, 2.4713, 2.3345, 0.3416,
            0.3496, 0.3771, 0.4589, 0.5312, 0.4010, 0.3979, 0.4962, 0.4155, 1.5216, 1.9821, 2.0534, 1.9190, 2.1304, 2.0550, 0.4164, 0.3163, 0.3769, 0.3084, 0.3057, 0.5550, 2.4502, 2.4344, 2.4711,
            0.5864, 0.4145, 1.4346, 1.2206, 1.1641, 1.1854, 1.4302, 1.2650, 1.2106, 1.2362, 2.1072, 2.2292, 2.2540, 2.2515, 2.1413, 1.3779, 0.4351, 0.4848, 0.4126, 0.4116, 0.4636, 1.6039, 1.4586,
            0.5151, 0.5575, 0.4864, 0.4646, 0.5820, 0.8007, 1.8417, 1.4448, 1.5149, 1.2614, 1.8813, 2.2308, 2.6529, 2.4137, 2.4789, 2.2823, 0.6035, 0.4617, 0.4325, 0.4326, 0.4931, 0.4317, 0.4336,
            2.1626, 1.8980, 1.8497, 1.7214, 1.6133, 2.1586, 2.2054, 1.9398, 2.2304, 2.2965, 2.6892, 2.2029, 2.0947, 2.2010, 2.0594, 2.3072, 2.1845, 0.5890, 0.4325, 0.4460, 0.4177, 0.3974, 0.4531,
            0.6780, 2.0238, 2.1381, 1.8534, 0.5632, 0.4078, 0.4120, 1.7258, 1.8074, 1.8381, 1.8144, 2.2601, 2.1632, 2.2293, 2.1325, 2.2701, 2.2375, 2.0343, 1.2607, 0.4718, 0.3699, 0.3641, 0.4189,
            0.3577, 0.3613, 1.8091, 1.9700, 0.8148, 0.3806, 0.3937, 0.4502, 0.4435, 1.8289, 2.2139, 2.2094, 2.0012, 2.3237, 2.2432, 2.1402, 2.2650, 2.2590, 1.9532, 0.4057, 0.3903, 0.4240, 0.3505,
            0.3455, 0.3512, 0.4205, 0.4744, 1.9236, 1.7480, 0.8956, 0.4032, 1.3708, 1.6185, 1.7084, 2.0608, 2.0379, 1.8641, 2.0441, 2.0601, 1.9463, 1.9910, 2.0952, 1.8279, 0.4444, 0.3686, 0.4114,
            0.3473, 0.3465, 0.4103, 0.5952, 1.7442, 1.7580, 0.7909, 0.3648, 0.3750, 0.3715, 0.4907, 0.3882, 1.5200, 1.8699, 1.0659, 1.8955, 1.9042, 1.7786, 1.8644, 1.9100, 1.7525, 0.8809, 0.1952,
            0.2233, 0.1622, 0.1771, 0.1529, 0.4657, 1.5508, 1.7401, 1.0457, 0.1873, 0.1851, 0.1974, 0.1832, 0.3150, 1.5740, 1.5926, 1.6737, 2.1082, 1.9096, 1.8227, 2.0389, 1.9729, 1.7401, 0.2330,
            0.2852, 0.1774, 0.1736, 0.2419, 0.1771, 0.1714, 1.7455, 1.6322, 1.2437, 0.1885, 0.2292, 1.6299, 1.7185, 0.6838, 1.2500, 1.5903, 1.1192, 2.1285, 1.9945, 1.9752, 1.9654, 2.0310, 1.8465,
            0.9697, 0.2221, 0.1834, 0.2534, 0.1888, 0.1737, 0.4909, 1.7179, 1.5611, 1.0622, 0.3301, 1.7428, 1.9335, 2.0209, 1.7564, 1.9371, 1.9730, 1.9974, 1.9560, 1.4894, 1.7465, 1.8917, 0.9000,
            0.2628, 0.1993, 0.1806, 0.2221, 0.1645, 0.1647, 0.1615, 0.6509, 2.0172, 1.5524, 1.5391, 0.5975, 0.2607, 0.9933, 0.7735, 0.7247, 0.9387, 1.9662, 1.8702, 1.6568, 1.9115, 1.9124, 1.7146,
            1.9018, 1.8511, 1.1599, 0.2191, 0.1763, 0.2352, 0.1772, 0.1766, 1.4378, 2.3370, 2.2807, 0.9947, 0.2625, 0.1930, 0.2172, 1.3142, 1.9635, 1.8081, 1.8226, 2.0163, 1.8646, 2.0136, 1.9684,
            1.9219, 1.9759, 1.9790, 1.2109, 0.3078, 0.1909, 0.1797, 0.2354, 0.1657, 0.1688, 1.3279, 0.1916, 0.1830, 0.2584, 0.2189, 0.6278, 1.7368, 1.9788, 1.8260, 2.0112, 2.1872, 1.9257, 2.1440,
            2.1716, 1.7669, 1.9412, 1.9599, 1.0416, 0.2586, 0.2901, 0.2306, 0.2324, 0.2345, 2.3392, 2.3216, 2.9079, 0.4151, 0.2621, 0.2638, 0.2604, 0.4323, 0.4843, 0.4805, 0.4940, 1.2494, 1.5038,
            1.9453, 2.0095, 1.8280, 1.9246, 1.9482, 0.3303, 0.1930];

    var data = { enabled : false, description : 'Power', data : powerData };
    this.dataStreams.push(data);

    var scaleFactor = 10;

    var sineData = [];
    for(var t=0; t<Math.PI * 50; t+=Math.PI/16) {
        var y = Math.sin(t);
        sineData.push(y);
    }
    data = { enabled : false, description : 'Sine', data : sineData };
    this.dataStreams.push(data);

    var singleData = [1, 1, 1, 1, 1, 0, 0, 0, 0, 0];
    var squareData = [];
    for(var t=0; t<500; ++t) {
        squareData.push(singleData[t%10] * 2);
    }
    data = { enabled : false, description : 'Square', data : squareData };
    this.dataStreams.push(data);

    var colours = [0x00ff00, 0xFF40B3, 0x4FABFF];

    for(var stream=0; stream<this.dataStreams.length; ++stream) {
        var currentData = this.dataStreams[stream];
        var numPoints = currentData.data.length;
        var geometry = new THREE.BufferGeometry();
        var material = new THREE.LineBasicMaterial({ color: colours[stream] });

        var positions = new Float32Array(numPoints * 3);

        for (var i = 0; i < numPoints; i++) {
            // positions
            var dataPoint = currentData.data[i];
            positions[ i * 3 ] = i;
            positions[ i * 3 + 1 ] = dataPoint * scaleFactor;
            positions[ i * 3 + 2 ] = 0;
        }

        geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.computeBoundingSphere();

        var lineMesh = new THREE.Line(geometry, material);
        lineMesh.name = 'lineMesh' + stream;
        lineMesh.visible = currentData.enabled;
        dataGroup.add(lineMesh);
    }
    this.scene.add(dataGroup);
};
*/

Oscilloscope.prototype.getData = function(delta) {
    //Simulate getting live data
    this.totalDelta += (delta *1000);
    if(this.totalDelta >= this.periodMS) {
        this.totalTime += Math.PI/32;
        var y = 10 * Math.sin(this.totalTime);
        this.positions[this.vertexPos++] = 0;//this.totalTime;
        this.positions[this.vertexPos++] = y;
        this.positions[this.vertexPos++] = 3;
        this.geometry.offsets = [ {start: 0, count: ++this.indexPos, index: 0}];
        //this.lineMesh.geometry.verticesNeedUpdate = true;
        this.geometry.attributes.position.needsUpdate = true;
        this.totalDelta = 0;
    }
};

Oscilloscope.prototype.subscribe = function() {
    //Subscribe to pubnub channel
    this.channel = PubNubBuffer.subscribe(this.channelName,
        "sub-c-2eafcf66-c636-11e3-8dcd-02ee2ddab7fe",
        1000,
        300);
};

Oscilloscope.prototype.updateChannel = function(chanNumber) {
    //Update channel
    var data = this.channel.getLastValue(this.channels[chanNumber].name);
    if(data != undefined) {
        //Check max value
        if(data.data > this.maxValueRetrieved) {
            //Don't update if value too big
            if(data.data < this.maxScaleFactorValue) {
                this.maxValueRetrieved = data.data;
                //this.scaleFactorAmp = (this.maxValueRetrieved / this.controlScale);
                //this.scaleFactorYShift = this.maxValueRetrieved / 3;
            }
        }

        this.timeSeries[chanNumber].append(data.timeStamp, data.data);

        updateDisplay(chanNumber+1, data.data, this.channels[chanNumber].type, this.maxDisplayDigits);
        var limit = this.maxDataValue/this.yScale;
        var boundUpper = data.data > limit;
        var boundLower = data.data < -limit;
        if(this.channels[chanNumber].maxBound != boundUpper) {
            updateBoundsIndicator(boundUpper, true, chanNumber+1);
        }
        if(this.channels[chanNumber].minBound != boundLower) {
            updateBoundsIndicator(boundLower, false, chanNumber+1);
        }
        this.channels[chanNumber].maxBound = boundUpper;
        this.channels[chanNumber].minBound = boundLower;
    }
};

Oscilloscope.prototype.displayChannel = function(id) {
    //Toggle display for given channel
    //See if currently subscribing

    if(!this.subscribed) {
        //Get channel to subscribe to
        this.channelName = $('#channelName').val();
        if(this.channelName) {
            this.subscribe();
            this.subscribed = true;
        } else {
            console.log('No channel name');
            return;
        }
    }
    //Get channel id
    var chanId = id.substr(6, 2);
    var channelName = $('#streamName'+chanId).val();
    if(!channelName) return;

    var chan = parseInt(chanId);
    if(!isNaN(chan)) --chan;

    if(chan < 0 || chan >= this.channelNames.length) return;

    this.channels[chan].enabled = !this.channels[chan].enabled;

    //Update visible channels
    this.numVisChannels = 0;
    for(var i=0; i<this.channelNames.length; ++i) {
        this.channels[i].enabled ? ++this.numVisChannels : null;
    }

    //Update status
    chanId = chan+1;
    var elem = 'streamStatus'+chanId;
    var image = this.channels[chan].enabled ? 'images/green_circle.png' : 'images/red_circle.png';
    $('#'+elem).attr('src', image);
    //Update indicators
    if(!this.channels[chan].enabled) {
        updateBoundsIndicator(false, true, chan+1);
        this.channels[chan].maxBound = false;
        updateBoundsIndicator(false, false, chan+1);
        this.channels[chan].minBound = false;
    }
};

Oscilloscope.prototype.onScaleAmplitude = function(value, changeValue) {
    //Alter output scale
    var inc = 0;
    if(value > changeValue) inc = this.scaleFactorAmp;
    if(value < changeValue) inc = -this.scaleFactorAmp;

    var streams = this.scene.getObjectByName('dataStreams');
    if(streams) {
        streams.scale.y += inc;
        if(streams.scale.y <= 0) streams.scale.y = 0.01;
        this.yScale = streams.scale.y.toFixed(2);
        //Output value
        $('#ampScaleValue').html(this.yScale);
    }
};

Oscilloscope.prototype.onScaleTime = function(value, changeValue) {
    //Adjust time scale
    var inc = 0;
    var scaleFactor = 0.1;
    if(value > changeValue) inc = scaleFactor;
    if(value < changeValue) inc = -scaleFactor;

    this.timeScale += inc;
    //Output value
    $('#timeScaleValue').html(this.timeScale.toFixed(2));
};

Oscilloscope.prototype.onYShift = function(value, changeValue) {
    //Adjust y position of values
    var inc = 0;
    if(value > changeValue) inc = this.scaleFactorYShift;
    if(value < changeValue) inc = -this.scaleFactorYShift;

    var dataGroup = this.scene.getObjectByName('dataStreams', true);
    if(dataGroup) {
        dataGroup.position.y += inc;
        //Output value
        $('#shiftScaleValue').html(dataGroup.position.y.toFixed(2));
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

Oscilloscope.prototype.toggleSelectAll = function() {
    this.allSelected = !this.allSelected;
    this.selectAll();
};

Oscilloscope.prototype.selectAll = function() {
    var image = this.allSelected ? 'images/green_circle.png' : 'images/red_circle.png';
    var elem;
    var stream;
    for(var i=0; i<this.channelNames.length; ++i) {
        stream = i+1;
        elem = $('#streamStatus'+stream);
        elem.attr('src', image);
        this.channels[i].enabled = this.allSelected;
        //Update indicators
        if(!this.channels[i].enabled) {
            updateBoundsIndicator(false, true, i+1);
            this.channels[i].maxBound = false;
            updateBoundsIndicator(false, false, i+1);
            this.channels[i].minBound = false;
        }
    }
    this.numVisChannels = this.allSelected ? this.channelNames.length : 0;
};

Oscilloscope.prototype.autoSeparate = function() {
    this.autoSep = !this.autoSep;

    if(this.autoSep) {
        this.separateChannels();
    }
};

Oscilloscope.prototype.separateChannels = function() {
    //Work out separation distance
    var yInc = (MAXY - MINY)/this.numVisChannels;
    var visChannel = 0;
    var startY = MINY;
    for(var i=0; i<this.dataStreams.length; ++i) {
        var name = 'lineMesh'+i;
        var line = this.scene.getObjectByName(name, true);
        if(line && line.visible) {
            line.position.y = startY + (visChannel++ * yInc);
        }
    }
};

Oscilloscope.prototype.createChildWindow = function() {
    //Create new browser window
    //Quarter the size of main window
    //Only create if data selected
    if(this.numVisChannels == 0) return;

    var childWidth = window.innerWidth/2;
    var childHeight = window.innerHeight/2;

    var props = 'height='+childHeight+' width='+childWidth+' location=0';
    //Get all enabled streams
    var channels = [];
    for(var i=0; i<this.channels.length; ++i) {
        if(this.channels[i].enabled) {
            channels.push( {name: this.channels[i].name, type: this.channels[i].type} );
        }
    }
    window.visData = { channelName: this.channelName, streams: channels};
    window.open("child.html", '_blank', props);
};

/*
Oscilloscope.prototype.onKeyDown = function(event) {
    //Do any base app key handling
    BaseApp.prototype.keydown.call(this, event);

    switch (event.keyCode) {
        case 80: //'P'
            console.log("CamPos=", this.camera.position);
            console.log("Lookat=", this.controls.getLookAt());
            break;
    }
};
*/

Oscilloscope.prototype.toggleGrid = function() {
    //Toggle grid display
    var grid = this.scene.getObjectByName('grid', true);
    if(grid) {
        this.gridVisible = !this.gridVisible;
        grid.visible = this.gridVisible;
    }
};

Oscilloscope.prototype.toggleScale = function() {
    //Toggle scale display
    var scale = this.scene.getObjectByName('scaleGroup', true);
    if(scale) {
        this.scaleVisible = !this.scaleVisible;
        var _this = this;
        scale.traverse(function(obj) {
            if(obj instanceof THREE.Mesh) {
                obj.visible = _this.scaleVisible;
            }
        });
    }
};

Oscilloscope.prototype.validateChannel = function() {
    //Reset
    this.subscribed = false;
    this.resetStreams();

    //Subscribe to pubnub channel
    this.channelName = $('#channelName').val();
    this.channel = PubNubBuffer.subscribe(this.channelName,
        "sub-c-2eafcf66-c636-11e3-8dcd-02ee2ddab7fe",
        1000,
        300);

    $('#waitConnection').show();

    //Wait for message to be returned
    var _this = this;
    this.waitTimer = setInterval(function() {
        _this.checkConnection()}, 1000
    );
};

Oscilloscope.prototype.checkConnection = function() {
    //See if we have subscribed
    this.channelNames = this.channel.getChannelNames();
    if(this.channelNames != null) {
        console.log("Got channels");
        this.subscribed = true;
        $('#waitConnection').hide();
        if(this.channelNames.length > this.numDisplayChannels) this.channelNames.length = this.numDisplayChannels;
        clearInterval(this.waitTimer);
        this.populateChannels(this.channelNames);
        this.updateChannelNames(this.channelNames);
        this.updateChannelTypes(this.channel.getChannelTypes());
        this.connectionAttempts = 0;
        $('#titleData').html('Output - ' +this.channelName);
        //Ensure enable all is consistent
        this.selectAll();
    } else {
        ++this.connectionAttempts;
        if(this.connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
            this.connectionAttempts = 0;
            $('#waitConnection').hide();
            $('#connectionError').show();
            clearInterval(this.waitTimer);
            this.channelName = null;
            $('#channelName').val('');
        }
    }
};

Oscilloscope.prototype.updateChannelNames = function(channels) {
    //Update channel structure with names
    var maxChan = channels.length < this.numDisplayChannels ? channels.length : this.numDisplayChannels;
    for(var i=0; i<maxChan; ++i) {
        this.channels[i].name = channels[i];
    }
};

Oscilloscope.prototype.updateChannelTypes = function(channels) {
    //Update channel structure with types
    var maxChan = channels.length < this.numDisplayChannels ? channels.length : this.numDisplayChannels;
    for(var i=0; i<maxChan; ++i) {
        this.channels[i].type = channels[i];
    }
};

Oscilloscope.prototype.resetStreams = function() {
    //Clear display
    var elem;
    var stream;
    if(this.channelNames == null) return;

    for(var i=0; i<this.channelNames.length; ++i) {
        stream = i+1;
        elem = $('#streamName'+stream);
        elem.html('');
        elem = $('#streamStatus'+stream);
        elem.attr('src', 'images/red_circle.png');
        elem = $('#streamValue'+stream);
        elem.html('000000');
        elem.css('padding-left', '0.5em');
        elem = $('#indicatorUpStream'+stream);
        elem.attr('src', 'images/arrowUp.png');
        elem = $('#indicatorDownStream'+stream);
        elem.attr('src', 'images/arrowDown.png');
        this.channels[i].enabled = false;
        this.channels[i].indexPos = 0;
        this.channels[i].vertexPos = 0;
    }

    //Reset variables
    this.numVisChannels = 0;
    this.timeScale = 1;
    this.yScale = 1;

    $('#ampScale').val(1).trigger('change');
    $('#timeScale').val(1).trigger('change');
    $('#yShift').val(1).trigger('change');
};

Oscilloscope.prototype.populateChannels = function(channels) {
    //Clear channels
    var chan;
    for(chan=1; chan<=this.numDisplayChannels; ++chan) {
        streamName = 'streamName' + chan;
        $('#'+streamName).val('');
    }
    //Fill channel names
    var streamName;
    var maxChan = channels.length < this.numDisplayChannels ? channels.length : this.numDisplayChannels;
    for(chan=1; chan<=maxChan; ++chan) {
        streamName = 'streamName' + chan;
        $('#'+streamName).val(channels[chan-1]);
    }
};

function updateDisplay(channel, data, type, maxDigits) {
    //Update data display
    //Format data
    var elem = $('#streamValue'+channel);
    var digits = getValueRange(data);
    var precision = 2;
    var positive = 1;
    var addSpace = false;
    if(data < 0) {
        --maxDigits;
        positive = 0;
        precision = 1;
        addSpace = true;
    }

    if(digits == null) {
        data = data.toExponential(precision);
    } else if(type == 'int') {
        if(digits < maxDigits) {
            //Pad out number
            var spaces = (maxDigits-digits)*2 - positive;
            for(var i=0; i<spaces; ++i) {
                data = '&nbsp' + data;
            }
        }
    } else if(type == 'float') {
        maxDigits--;
        if(digits < maxDigits) {
            data = data.toFixed(maxDigits-digits);
        } else {
            addSpace = true;
        }
        if(addSpace) {
            data = '&nbsp' + data;
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

$(document).ready(function() {
    //Initialise app
    var container = document.getElementById("WebGL-output");
    var app = new Oscilloscope(container);
    app.init();
    //app.createScene();
    //app.createGUI();

    //GUI callbacks
    $(".dataChannels").on("click", function(evt) {
        app.displayChannel(evt.currentTarget.id);
    });

    $('#errorOK').on("click", function(evt) {
        $('#connectionError').hide();
    });

    //GUI Controls
    var ampScale = $('#ampScale'), timeScale = $('#timeScale'), yShift = $('#yShift');
    ampScale.knob({
        stopper : false,
        change : function(value) {
            app.onScaleAmplitude(value, this.cv);
        },
        format: function(value) {
            return 'Amplitude';
        }
    });

    timeScale.knob({
        change : function(value) {
            app.onScaleTime(value, this.cv);
        },
        format: function(value) {
            return 'Time';
        }
    });

    yShift.knob({
        change : function(value) {
            app.onYShift(value, this.cv);
        },
        format: function(value) {
            return 'Y-Shift';
        }
    });

    ampScale.css('font-size', '15px');
    timeScale.css('font-size', '15px');
    yShift.css('font-size', '15px');

    $('#timeBack').on("click", function(evt) {
        app.showPreviousTime();
    });

    $('#timeForward').on("click", function(evt) {
        app.showNextTime();
    });

    $('#all').on("change", function(evt) {
        app.toggleSelectAll();
    });

    $('#grid').on('click', function() {
        app.toggleGrid();
    });

    $('#scale').on('click', function() {
        app.toggleScale();
    });

    $('#newChild').on("click", function(evt) {
        app.createChildWindow();
    });


    $('#channelName').on("keydown", function(evt) {
        if(evt.which == 13) {
            app.validateChannel();
        }
    });


    /*
    $(document).keydown(function (event) {
        app.onKeyDown(event);
    });
    */

    app.run();
});

