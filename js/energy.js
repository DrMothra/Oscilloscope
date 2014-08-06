/**
 * Created by atg on 21/07/2014.
 */

//Globals
var GROUND_DEPTH = 10;
var GROUND_WIDTH = 180;
var SCREEN_WIDTH = 90;
var SCREEN_HEIGHT = 40;

function eliminateDuplicates(arr) {
    var r = [];
    start: for(var i = 0; i < arr.length; ++i) {
        for(var x = 0; x < r.length; ++x) {
            if(r[x]==arr[i]) {
                continue start;
            }
        }
        r[r.length] = arr[i];
    }
    return r;
}

var daysMonth = {'Jan':31, 'Feb':28, 'Mar':31, 'Apr':30, 'May':31, 'Jun':30,
    'Jul':31, 'Aug':31, 'Sep':30, 'Oct':31, 'Nov':30, 'Dec':31};

var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu','Fri', 'Sat'];

function getHoursFromStart(date, hour) {
    return (date-1)*24 + hour;
}

function daysPerMonth(month) {
    return daysMonth[month];
}

function constructDate(day, date, month, hour) {
    //Construct date in required format
    return day+' '+date+' '+month+' 2014 - '+hour+':00 - '+hour+':59';
}

function getNextDay(day) {
    //Get next day of week
    for(var i=0; i<dayNames.length; ++i) {
        if(day == dayNames[i]) {
            ++i;
            return i<dayNames.length ? dayNames[i] : dayNames[0];
        }
    }
}

function getPreviousDay(day) {
    //Get previous day of the week
    for(var i=0; i<dayNames.length; ++i) {
        if (day == dayNames[i]) {
            --i;
            return i < 0 ? dayNames[6] : dayNames[i];
        }
    }
}

function getDayName(date) {
    //Get name of day - always first 3 letters
    return date.substr(0, 3);
}

function getDate(date) {
    //Get day number - could be single or double figures
    var day = date.substr(4, 2);
    if(parseInt(day) < 10) {
        day = date.substr(4, 1);
    }
    return day;
}

function getMonth(date) {
    //Get month string
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for(var i=0; i<months.length; ++i) {
        if(date.indexOf(months[i]) >= 0) return months[i];
    }

    return null;
}

function getHour(date) {
    //Get hour string
    var hour = date.substr(17, 3);
    return parseInt(hour);
}

function getMaxOccupancy(name) {
    //max occupancy at end of file
    var max = name.indexOf('(');
    if(max >= 0) {
        return parseInt(name.substr(max+1, 3));
    }

    return -1;
}

function getOccupancyGroup(screenGroup) {
    //Get occupancy group from given group
    for(var i=0; i<screenGroup.children.length; ++i) {
        if(screenGroup.children[i].name.indexOf('Occupancy') >=0) {
            return screenGroup.children[i];
            break;
        }
    }

    return null;
}

//Init this app from base
function EnergyApp() {
    BaseApp.call(this);
}

EnergyApp.prototype = new BaseApp();

EnergyApp.prototype.init = function(container) {
    BaseApp.prototype.init.call(this, container);
    this.data = null;
    this.updateRequired = false;
    this.guiControls = null;
    this.dataFile = null;
    this.filename = '';
    this.objectsRendered = 0;
    //Animation
    this.totalDelta = 0;
    this.startRot;
    this.startPos;
    this.rotInc = Math.PI/180 * 72;
    this.posInc = 10;
    this.animate = false;
    this.animating = false;
    this.animationTime = 2;
    this.animationGroup;
};

EnergyApp.prototype.update = function() {
    //Perform any updates
    var delta = this.clock.getDelta();
    var clicked = this.mouse.clicked;

    //Perform mouse hover
    var vector = new THREE.Vector3(( this.mouse.x / window.innerWidth ) * 2 - 1, -( this.mouse.y / window.innerHeight ) * 2 + 1, 0.5);
    this.projector.unprojectVector(vector, this.camera);

    var raycaster = new THREE.Raycaster(this.camera.position, vector.sub(this.camera.position).normalize());

    this.hoverObjects.length = 0;
    this.hoverObjects = raycaster.intersectObjects(this.scene.children, true);

    //Check hover actions
    if(this.hoverObjects.length != 0) {
        for(var i=0; i<this.hoverObjects.length; ++i) {

        }
    }

    //Animation
    if(this.animating) {
        this.root.rotation.y += (delta/this.animationTime) * this.rotInc;
        this.animationGroup.position.y -= (delta/this.animationTime) * this.posInc;
        this.totalDelta += delta;
        if(this.totalDelta >= this.animationTime) {
            this.animating = false;
            this.totalDelta = 0;
            this.root.rotation.y = this.startRot + this.rotInc;
            this.animationGroup.position.y = this.startPos - this.posInc;
            hideGroup(this.animationGroup);
        }
    }
    BaseApp.prototype.update.call(this);
};

EnergyApp.prototype.createScene = function() {
    //Init base createsScene
    BaseApp.prototype.createScene.call(this);

    this.root = new THREE.Object3D();
    this.root.name = 'root';
    this.scene.add(this.root);

    this.screenGroups = [];
    //Model loading
    //Load models but don't add to scene yet
    var _this = this;
    this.modelLoader = new THREE.JSONLoader();
    this.modelLoader.load('models/person2.js', function(geom, material) {
        //Save geometry for later
        _this.personGeom = geom;
    });
    //Create screen
    this.modelLoader.load('models/screen.js', function(geom, materials) {
        //Model loaded, create groups, etc.
        _this.screenGeometry = geom;
        var material = new THREE.MeshLambertMaterial(materials);
        _this.screenMaterial = material;
    });
};

EnergyApp.prototype.createEnvironment = function() {
    //Create world structure
    var xPos = [0, 95, 58.8, -58.8, -95];
    var zPos = [100, 31, -81, -81, 31];
    var screenName = ['Lounge', 'Screen1', 'Screen2', 'Screen3', 'Screen4'];
    var scalingFactor = 1.5;
    //Group properties
    var occupancies = [];
    var occupancyScale = new THREE.Vector3(1, 1, 1);
    var occupancyPerRow = 10;
    var startPos = new THREE.Vector3(-22.5, -56, 0);
    var increments = new THREE.Vector3(5, 0, 5);

    var occupancyGroup = {'occupancyScale' : occupancyScale, 'occupancyPerRow' : occupancyPerRow, 'startPos' : startPos, 'increments' : increments};
    //Lounge
    occupancies.push(occupancyGroup);
    //Screen 1
    occupancyScale = new THREE.Vector3(0.5, 0.5, 0.5);
    occupancyPerRow = 30;
    startPos = new THREE.Vector3(-70, -56, -10);
    occupancyGroup = {'occupancyScale' : occupancyScale, 'occupancyPerRow' : occupancyPerRow, 'startPos' : startPos, 'increments' : increments};
    occupancies.push(occupancyGroup);
    //Screen 2
    occupancyScale = new THREE.Vector3(1, 1, 1);
    occupancyPerRow = 20;
    startPos = new THREE.Vector3(-45, -56, 0);
    occupancyGroup = {'occupancyScale' : occupancyScale, 'occupancyPerRow' : occupancyPerRow, 'startPos' : startPos, 'increments' : increments};
    occupancies.push(occupancyGroup);
    //Screen 3
    occupancyScale = new THREE.Vector3(1, 1, 1);
    occupancyPerRow = 20;
    startPos = new THREE.Vector3(-45, -56, 0);
    occupancyGroup = {'occupancyScale' : occupancyScale, 'occupancyPerRow' : occupancyPerRow, 'startPos' : startPos, 'increments' : increments};
    occupancies.push(occupancyGroup);
    //Screen 4
    occupancyScale = new THREE.Vector3(1, 1, 1);
    occupancyPerRow = 15;
    startPos = new THREE.Vector3(-35, -56, 0);
    occupancyGroup = {'occupancyScale' : occupancyScale, 'occupancyPerRow' : occupancyPerRow, 'startPos' : startPos, 'increments' : increments};
    occupancies.push(occupancyGroup);

    var dataTexture = THREE.ImageUtils.loadTexture("images/noData.png");
    var emptyMaterial = new THREE.MeshLambertMaterial({color : 0xffffff});
    var dataMaterial = new THREE.MeshLambertMaterial({map : dataTexture, transparent : true});
    for(var i=0; i<this.locationNames.length; ++i) {
        var group = new THREE.Object3D();
        group.name = this.locationNames[i];
        group.position.set(xPos[i], 0, zPos[i]);
        group.position.multiplyScalar(scalingFactor);
        this.screenGroups.push(group);
        var occupancy = new THREE.Object3D();
        occupancy.name = 'Occupancy' + group.name;
        occupancy.properties = occupancies[i];
        //Add geometry to group
        //Get group properties
        var props = occupancies[i];
        var startPos = props['startPos'];
        var scale = props['occupancyScale'];
        var xInc = props['increments'].x;
        var zInc = props['increments'].z;
        var occPerRow = props['occupancyPerRow'];
        var maxOccupancy = this.maxOccupancy[i];
        for(var j=0; j<maxOccupancy; ++j) {
            var person = new THREE.Mesh(this.personGeom, emptyMaterial);
            person.visible = false;
            person.scale.set(scale.x, scale.y, scale.z);
            person.position.x = startPos.x + (j%occPerRow * xInc);
            person.position.y = startPos.y;
            person.position.z = startPos.z + (parseInt(j/occPerRow)*zInc);
            occupancy.add(person);
        }
        //Add indication for no data available
        var unknownGeom = new THREE.PlaneGeometry(10, 10);
        var unknown = new THREE.Mesh(unknownGeom, dataMaterial);
        unknown.name = 'noData';
        unknown.position.set(0, -55, 0);
        unknown.visible = false;
        occupancy.add(unknown);
        group.add(occupancy);
        addGround(group, GROUND_WIDTH, GROUND_DEPTH);
        //Add screen
        var screen = new THREE.Mesh(this.screenGeometry, this.screenMaterial);
        screen.name = 'Screen';
        screen.scale.x = 1.25;
        screen.position.y = -40;
        screen.position.z = -20;
        group.add(screen);
        var title = createScreenTitle(screenName[i]);
        title.position.y = -27.5;
        title.position.z = -20;
        group.add(title);
        group.rotation.y = this.rotInc * i;
        this.root.add(group);
    }

    //Add line graph data
    var lineData = {"Domain": "(null)", "Reference": "(null)", "Version": "(null)", "ts": "2014-06", "Log Program Version": "2", "Coverage": "(null)", "reading units": "kW",
        "data": {"start": 1401577200000, "step": 3600000, "readings": [
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
        1.9453, 2.0095, 1.8280, 1.9246, 1.9482, 0.3303, 0.1930]}};

    var numPoints = lineData.data.readings.length;
    var geometry = new THREE.BufferGeometry();
    var material = new THREE.LineBasicMaterial({ color : 0xffffff });
    var scaleFactor = 10;
    var positions = new Float32Array( numPoints * 3 );
    //var colours = new Float32Array( numPoints * 3 );

    for ( var i = 0; i < numPoints; i ++ ) {
        // positions
        var dataPoint = lineData.data.readings[i];
        positions[ i * 3 ] = i;
        positions[ i * 3 + 1 ] = dataPoint*scaleFactor;
        positions[ i * 3 + 2 ] = 0;

       // colours[ i * 3] = 0.5;
        //colours[ i * 3 + 1 ] = 0.5;
        //colours[ i * 3 + 2 ] = 0.5;
    }

    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
    //geometry.addAttribute( 'color', new THREE.BufferAttribute( colours, 3));
    geometry.computeBoundingSphere();

    var lineMesh = new THREE.Line( geometry, material );
    var lineDataGroup = new THREE.Object3D();
    lineDataGroup.name = 'lineData';
    lineDataGroup.position.x = -139;
    lineDataGroup.add(lineMesh);
    this.scene.add(lineDataGroup);

    //Time line
    var timeGeom = new THREE.BufferGeometry();
    var timeMat = new THREE.LineBasicMaterial({ color : 0xFF3CB3});
    var scalePosition = new Float32Array(6);
    var scaleStart = new THREE.Vector3(0, 0, 0);
    var scaleEnd = new THREE.Vector3(0, 30, 0);
    scalePosition[0] = scaleStart.x;
    scalePosition[1] = scaleStart.y;
    scalePosition[2] = scaleStart.z;
    scalePosition[3] = scaleEnd.x;
    scalePosition[4] = scaleEnd.y;
    scalePosition[5] = scaleEnd.z;
    timeGeom.addAttribute('position', new THREE.BufferAttribute(scalePosition, 3));
    timeGeom.computeBoundingSphere();

    var timeLine = new THREE.Line(timeGeom, timeMat);
    timeLine.name = 'timeLine';

    this.scene.add(timeLine);
};

EnergyApp.prototype.createGUI = function() {
    //Create GUI - use dat.GUI for now
    this.guiControls = new function() {
        this.filename = '';

        //Colours
        this.Ground = '#1a2f46';
        this.Background = '#5c5f64';
    };

    //Create GUI
    var gui = new dat.GUI();

    var _this = this;
    //Create two folders - Appearance and Data
    gui.add(this.guiControls, 'filename', this.filename).listen();
    this.guiAppear = gui.addFolder("Appearance");

    this.guiAppear.addColor(this.guiControls, 'Ground').onChange(function(value) {
        _this.groundColourChanged(value);
    });
    this.guiAppear.addColor(this.guiControls, 'Background').onChange(function(value) {
        _this.renderer.setClearColor(value, 1.0);
    });
    this.guiData = gui.addFolder("Data");
};

EnergyApp.prototype.generateGUIControls = function() {

};

EnergyApp.prototype.groundColourChanged = function(value) {
    var ground = this.scene.getObjectByName('ground');
    if(ground) {
        ground.material.color.setStyle(value);
    }
};

/*
EnergyApp.prototype.generateData = function() {
    //Parse data and rewrite in more suitable format
    var selected = ['hall_name_1', 'event_date_grouping', 'show_count_1', 'total_tkt_count_1', 'total_tkt_count_2'];
    var altered = ['hall_name', 'event_date', 'show_count', 'occupancy', 'admits'];
    var occupancy = [];
    for(var i=0; i<this.data.length; ++i) {
        //Only save selected data
        var newData = {};
        var item = this.data[i];
        for(var key in item) {
            for(var j=0; j<selected.length; ++j) {
                if(key == selected[j]) {
                    newData[altered[j]] = item[selected[j]];
                    break;
                }
            }
        }
        occupancy.push(newData);
    }
    //Save new data structure
    var bb = window.Blob;
    var filename = 'energy.json';
    saveAs(new bb(
            [JSON.stringify(occupancy)]
            , {type: "text/plain;charset=" + document.characterSet}
        )
        , filename);
};
*/

EnergyApp.prototype.generateData = function() {
    //Extract data - do this manually for now
    var item = this.data[0];
    this.currentDataLocation = 0;
    this.currentLocation = 0;
    this.currentLocationName = item['hall_name'];
    var dayName = getDayName(item['event_date']);
    this.dayName = dayName;
    var date = getDate(item['event_date']);
    this.date = parseInt(date);
    var month = getMonth(item['event_date']);
    this.month = month;
    var hour = getHour(item['event_date']);
    console.log('Hour =', hour);
    this.hour = hour;

    this.locationNames = [];
    //Separate location names
    for(var i=0; i<this.data.length; ++i) {
        item = this.data[i];
        this.locationNames.push(item['hall_name']);
    }
    //Remove duplicates
    this.locationNames = eliminateDuplicates(this.locationNames);

    //Get max occupancy from group name
    this.maxOccupancy = [];
    for(var i=0; i<this.locationNames.length; ++i) {
        var max = getMaxOccupancy(this.locationNames[i]);
        if(max > 0) {
            this.maxOccupancy.push(max);
        }
    }

    //Generate occupancy visuals
    this.createEnvironment();

    var item = this.data[0];
    populateInfoPanel(item);
    populateHall(this.screenGroups[this.currentLocation], this.personGeom, item['admits'], this.maxOccupancy[0]);
};

EnergyApp.prototype.findDate = function(dayName, day, month, hour) {
    //Construct date and find in data
    var eventDate = dayName+' '+day+' '+month+' 2014 - '+hour+':00 - '+hour+':59';
    for(var i=0; i<this.data.length; ++i) {
        var item = this.data[i];
        if(item['event_date'] == eventDate) {
            return item;
        }
    }

    return null;
};

EnergyApp.prototype.getLocation = function(item) {
    //Get location of item within data
    for(var i=0; i<this.data.length; ++i) {
        var obj = this.data[i];
        if(obj == item) {
            return i;
        }
    }

    return null;
};

EnergyApp.prototype.showPreviousLocation = function() {
    //Rotate screen structures
    this.startRot = this.root.rotation.y;
    if(this.rotInc < 0) this.rotInc *= -1;
    this.animating = true;
    this.animationGroup = getOccupancyGroup(this.screenGroups[this.currentLocation]);

    //Get data for previous location
    if(--this.currentLocation < 0) this.currentLocation = this.screenGroups.length-1;
    this.currentLocationName = this.locationNames[this.currentLocation];

    var screenGroup = this.screenGroups[this.currentLocation];
    var occGroup = getOccupancyGroup(screenGroup);

    console.log('Location =', this.currentLocationName);

    //Construct date
    var eventDate = this.dayName+' '+this.date+' '+this.month+' 2014 - '+this.hour+':00 - '+this.hour+':59';
    //Update current variables to something sensible
    //even if no exact match
    var resetPoint = -1;
    for(var i=0; i<this.data.length; ++i) {
        var item = this.data[i];
        if(item['hall_name'] == this.currentLocationName) {
            //We may need this later
            if(resetPoint < 0) resetPoint = i;
            if(item['event_date'] == eventDate) {
                //Update information
                populateInfoPanel(item);
                //showGroup(occGroup);
                occGroup.position.set(0, 0, 0);
                populateHall(screenGroup, this.personGeom, item['admits'], this.maxOccupancy[this.currentLocation]);
                this.currentDataLocation = i;
                return;
            }
        }
    }
    //Didn't find exact match
    //Set data pointers to sensible position
    this.currentDataLocation = resetPoint;
    var data = jQuery.extend({}, this.data[resetPoint]);
    data['event_date'] = eventDate;
    data['admits'] = -1;
    data['occupancy'] = -1;
    //Update information
    populateInfoPanel(data);
    //showGroup(occGroup);
    occGroup.position.set(0, 0, 0);
    populateHall(screenGroup, this.personGeom, -1, -1);
    //Animate occupancy group
    this.startPos = this.animationGroup.position.y;
};

EnergyApp.prototype.showNextLocation = function() {
    //Rotate screen structures
    this.startRot = this.root.rotation.y;
    if(this.rotInc > 0) this.rotInc *= -1;
    this.animating = true;
    this.animationGroup = getOccupancyGroup(this.screenGroups[this.currentLocation]);

    //Get data for next location
    if(++this.currentLocation >= this.screenGroups.length) this.currentLocation = 0;
    this.currentLocationName = this.locationNames[this.currentLocation];

    var screenGroup = this.screenGroups[this.currentLocation];
    var occGroup = getOccupancyGroup(screenGroup);
    console.log('Location =', this.currentLocationName);

    //Construct date
    var eventDate = this.dayName+' '+this.date+' '+this.month+' 2014 - '+this.hour+':00 - '+this.hour+':59';
    console.log('Date = ', eventDate);
    //Update current variables to something sensible
    //even if no exact match
    var resetPoint = -1;
    for(var i=0; i<this.data.length; ++i) {
        var item = this.data[i];
        if(item['hall_name'] == this.currentLocationName) {
            //we may need this later
            if(resetPoint < 0) resetPoint = i;
            if(item['event_date'] == eventDate) {
                //Update info
                populateInfoPanel(item);
                occGroup.position.set(0, 0, 0);
                populateHall(screenGroup, this.personGeom, item['admits'], this.maxOccupancy[this.currentLocation]);
                this.currentDataLocation = i;
                return;
            }
        }
    }
    //Didn't find exact match
    //Set data pointers to sensible position
    this.currentDataLocation = resetPoint;
    var data = jQuery.extend({}, this.data[resetPoint]);
    data['event_date'] = eventDate;
    data['admits'] = -1;
    data['occupancy'] = -1;
    //Update info
    populateInfoPanel(data);
    occGroup.position.set(0, 0, 0);
    populateHall(screenGroup, this.personGeom, -1, -1);
    //Animate occupancy group
    this.startPos = this.animationGroup.position.y;
};

EnergyApp.prototype.showPreviousTime = function() {
    //Go to previous time for selected location
    if(this.currentDataLocation == 0) return;

    var item = this.data[this.currentDataLocation-1];
    if(item['hall_name'] != this.currentLocationName) return;

    --this.currentDataLocation;
    //Update all date variables
    var date = item['event_date'];
    this.dayName = getDayName(date);
    this.date = parseInt(getDate(date));
    this.hour = parseInt(getHour(date));
    populateInfoPanel(item);
    //Update info
    populateHall(this.screenGroups[this.currentLocation], this.personGeom, item['admits'], this.maxOccupancy[this.currentLocation]);

    //Update timeline
    var hours = getHoursFromStart(this.date, this.hour);
    var timeLine = this.scene.getObjectByName('lineData');
    if(timeLine) {
        timeLine.position.x = -hours;
    }
};

EnergyApp.prototype.showNextTime = function() {
    //Go to next time for selected location
    var item = this.data[this.currentDataLocation+1];
    if(item['hall_name'] != this.currentLocationName) return;

    ++this.currentDataLocation;
    //Update all date variables
    var date = item['event_date'];
    this.dayName = getDayName(date);
    this.date = parseInt(getDate(date));
    this.hour = parseInt(getHour(date));
    populateInfoPanel(item);
    //Update info
    populateHall(this.screenGroups[this.currentLocation], this.personGeom, item['admits'], this.maxOccupancy[this.currentLocation]);

    //Update timeline
    var hours = getHoursFromStart(this.date, this.hour);
    var timeLine = this.scene.getObjectByName('lineData');
    if(timeLine) {
        timeLine.position.x = -hours;
    }
};

EnergyApp.prototype.showPreviousDay = function() {
    //Construct previous day from current day
    if(this.date-1 < 1) return;

    var date = --this.date;
    var hour = this.hour;
    var month = this.month;
    var dayName = getPreviousDay(this.dayName);
    this.dayName = dayName;

    var eventDate = constructDate(dayName, date, month, hour);
    for(var i=0; i<this.data.length; ++i) {
        var item = this.data[i];
        if(item['event_date'] == eventDate && item['hall_name'] == this.currentLocationName) {
            //Update info
            this.currentDataLocation = this.getLocation(item);
            populateInfoPanel(item);
            populateHall(this.screenGroups[this.currentLocation], this.personGeom, item['admits'], this.maxOccupancy[this.currentLocation]);
            //Update timeline
            var hours = getHoursFromStart(this.date, this.hour);
            var timeLine = this.scene.getObjectByName('lineData');
            if(timeLine) {
                timeLine.position.x = -hours;
            }
            return;
        }
    }
    //Not exact match
    var data = jQuery.extend({}, this.data[this.currentDataLocation]);
    data['event_date'] = eventDate;
    data['admits'] = -1;
    data['occupancy'] = -1;
    //Update info
    populateInfoPanel(data);
    populateHall(this.screenGroups[this.currentLocation], this.personGeom, -1, -1);
    //Update timeline
    var hours = getHoursFromStart(this.date, this.hour);
    var timeLine = this.scene.getObjectByName('lineData');
    if(timeLine) {
        timeLine.position.x = -hours;
    }
};

EnergyApp.prototype.showNextDay = function() {
    //Construct next day from current day
    if(this.date+1 > daysPerMonth(this.month)) return;

    var date = ++this.date;
    var dayName = getNextDay(this.dayName);
    this.dayName = dayName;
    var hour = this.hour;
    var month = this.month;

    var eventDate = constructDate(dayName, date, month, hour);
    for(var i=0; i<this.data.length; ++i) {
        var item = this.data[i];
        if(item['event_date'] == eventDate && item['hall_name'] == this.currentLocationName) {
            //Update info
            this.currentDataLocation = this.getLocation(item);
            populateInfoPanel(item);
            populateHall(this.screenGroups[this.currentLocation], this.personGeom, item['admits'], this.maxOccupancy[this.currentLocation]);
            //Update timeline
            var hours = getHoursFromStart(this.date, this.hour);
            var timeLine = this.scene.getObjectByName('lineData');
            if(timeLine) {
                timeLine.position.x = -hours;
            }
            return;
        }
    }
    //Not exact match
    var data = jQuery.extend({}, this.data[this.currentDataLocation]);
    data['event_date'] = eventDate;
    data['admits'] = -1;
    data['occupancy'] = -1;
    //Update info
    populateInfoPanel(data);
    populateHall(this.screenGroups[this.currentLocation], this.personGeom, -1, -1);
    //Update timeline
    var hours = getHoursFromStart(this.date, this.hour);
    var timeLine = this.scene.getObjectByName('lineData');
    if(timeLine) {
        timeLine.position.x = -hours;
    }
};

EnergyApp.prototype.onKeyDown = function(event) {
    //Do any base app key handling
    BaseApp.prototype.keydown.call(this, event);

    switch (event.keyCode) {
        case 80: //'P'
            console.log("CamPos=", this.camera.position);
            console.log("Lookat=", this.controls.getLookAt());
            break;
    }
};

EnergyApp.prototype.parseFile = function() {
    //Attempt to load and parse given json file
    if(!this.filename) return;

    console.log("Reading file...");

    var reader = new FileReader();
    var _this = this;
    reader.onload = function(evt) {
        //File loaded - parse it
        console.log('file read: '+evt.target.result);
        try {
            _this.data = JSON.parse(evt.target.result);
        }
        catch (err) {
            console.log('error parsing JSON file', err);
            alert('Sorry, there was a problem reading that file');
            return;
        }
        //File parsed OK - generate GUI controls and data
        _this.generateGUIControls();
        _this.generateData();
        _this.updateRequired = true;
    };

    // Read in the file
    reader.readAsText(this.dataFile, 'ISO-8859-1');
};

EnergyApp.prototype.onSelectFile = function(evt) {
    //User selected file
    //See if we support filereader API's
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        //File APIs are supported.
        var files = evt.target.files; // FileList object
        if (files.length==0) {
            console.log('no file specified');
            this.filename = "";
            return;
        }
        //Clear old data first
        if(this.dataFile) {
            this.reset();
        }
        this.dataFile = files[0];
        this.filename = this.dataFile.name;
        console.log("File chosen", this.filename);

        //Try and read this file
        this.parseFile();
    }
    else
        alert('sorry, file apis not supported');
};

function addGround(group, width, height) {
    //Create the ground object
    var groundGeometry = new THREE.CylinderGeometry(width/2, width/2, height, 12, 12, false);
    var texture = THREE.ImageUtils.loadTexture("images/grid.png");
    var planeMaterial = new THREE.MeshLambertMaterial({color : 0x1a2f46});
    var plane = new THREE.Mesh(groundGeometry, planeMaterial);
    //Give it a name
    plane.name = 'ground';
    //plane.receiveShadow  = true;

    // rotate and position the plane
    //plane.rotation.x=-0.5*Math.PI;
    plane.position.x=0;
    plane.position.y=-65;
    plane.position.z=0;

    group.add(plane);

    //Second plane
    groundGeometry = new THREE.PlaneGeometry(width, height, 1, 1);
    planeMaterial = new THREE.MeshLambertMaterial({color: 0x16283c});
    plane = new THREE.Mesh(groundGeometry, planeMaterial);
    plane.rotation.x=-0.5*Math.PI;
    plane.position.x=0;
    plane.position.y=-60;
    plane.position.z=0;
    //Give it a name
    plane.name = 'ground';

    // add the plane to the scene
    //scene.add(plane);
}

function populateHall(group, geom, occupancy, maxOccupancy) {
    //Get associated group
    var occupyGroup = getOccupancyGroup(group);

    var occupyMaterial = new THREE.MeshLambertMaterial({color : 0x000066});
    var surplusMaterial = new THREE.MeshLambertMaterial({color : 0xffffff});

    var occupied = occupancy >= 0;

    //Display occupancy
    if(!occupied) {
        occupyGroup.traverse(function(obj) {
            if(obj instanceof THREE.Mesh) {
                obj.visible = false;
            }
        });
    } else {
        for(var i=0; i<maxOccupancy; ++i) {
            var child = occupyGroup.children[i];
            child.material = i<occupancy ? occupyMaterial : surplusMaterial;
            child.visible = true;
        }
    }
    var unknown = occupyGroup.getObjectByName('noData');
    if(unknown) {
        unknown.visible = !occupied;
    }
}

function hideGroup(group) {
    //Make all occupants of group invisible
    group.traverse(function(obj) {
        if(obj instanceof THREE.Mesh) {
            obj.visible = false;
        }
    });
}

function showGroup(group) {
    //Make all occupants of group visible
    group.traverse(function(obj) {
        if(obj instanceof THREE.Mesh) {
            obj.visible = true;
        }
    });
}

function createScreenTitle(title) {
    //Create rectangle with given text
    var rectGeom = new THREE.PlaneGeometry(20, 6, 4, 4);

    var fontface = "Arial";
    var fontSize = 12;
    var spacing = 10;

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var metrics = context.measureText( title );
    var textWidth = metrics.width;

    canvas.width = textWidth + (spacing * 2);
    canvas.width *= 2;
    canvas.height = fontSize;
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillStyle = "rgba(255, 115, 41, 1.0)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = "rgba(255, 255, 255, 1.0)";
    context.font = fontSize + "px " + fontface;

    context.fillText(title, canvas.width/2, canvas.height/2);
    // canvas contents will be used for a texture
    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    var rectMaterial = new THREE.MeshLambertMaterial({map : texture});
    return new THREE.Mesh(rectGeom, rectMaterial);
}

function populateInfoPanel(data) {
    //Fill panel with relevant data

    for(var key in data) {
        var item = document.getElementById(key);
        if (item) {
            item.innerHTML = data[key] != -1 ? data[key] : 'n/a';
        }
    }

    //Remove any unnecessary data in headings
    var title = data['hall_name'];
    var end = title.indexOf('(');
    if(end >= 0) {
        title = title.substr(0, end);
        document.getElementById('hall_name').innerHTML = title;
    }

    //Separate date and time
    var date = data['event_date'];
    var join = date.indexOf('-');
    if(join >= 0) {
        var day = date.substr(0, join-1);
        document.getElementById('event_date').innerHTML = day;
    }
    var time = date.substr(join+1, date.length-join);
    document.getElementById('event_time').innerHTML = time;
}

function createLabel(name, position, scale, colour, fontSize, opacity) {

    var fontface = "Arial";
    var spacing = 10;

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var metrics = context.measureText( name );
    var textWidth = metrics.width;

    canvas.width = textWidth + (spacing * 2);
    canvas.width *= 2;
    canvas.height = fontSize;
    context.textAlign = "center";
    context.textBaseline = "middle";

    context.fillStyle = "rgba(255, 255, 255, 0.0)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    var red = Math.round(colour[0]);
    var green = Math.round(colour[1]);
    var blue = Math.round(colour[2]);

    context.fillStyle = "rgba(" + red + "," + green + "," + blue + "," + "1.0)";
    context.font = fontSize + "px " + fontface;

    context.fillText(name, canvas.width/2, canvas.height/2);

    // canvas contents will be used for a texture
    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    //texture.needsUpdate = true;
    var spriteMaterial = new THREE.SpriteMaterial({
            //color: color,
            transparent: false,
            opacity: opacity,
            useScreenCoordinates: false,
            blending: THREE.AdditiveBlending,
            map: texture}
    );

    var sprite = new THREE.Sprite(spriteMaterial);

    sprite.scale.set(scale.x, scale.y, 1);
    sprite.position.set(position.x, position.y, position.z);

    return sprite;
}

$(document).ready(function() {
    //Initialise app
    var container = document.getElementById("WebGL-output");
    var app = new EnergyApp();
    app.init(container);
    app.createScene();
    //app.createGUI();

    //GUI callbacks
    $("#chooseFile").on("change", function(evt) {
        app.onSelectFile(evt);
    });
    $("#locationBackward").on("click", function(evt) {
        app.showPreviousLocation();
    });
    $("#locationForward").on("click", function(evt) {
        app.showNextLocation();
    });
    $("#timeBackward").on("click", function(evt) {
        app.showPreviousTime();
    });
    $("#timeForward").on("click", function(evt) {
        app.showNextTime();
    });
    $("#dateBackward").on("click", function(evt) {
        app.showPreviousDay();
    });
    $("#dateForward").on("click", function(evt) {
        app.showNextDay();
    });
    $(document).keydown(function (event) {
        app.onKeyDown(event);
    });
    app.run();
});
