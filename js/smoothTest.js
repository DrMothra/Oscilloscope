/**
 * Created by atg on 08/04/2015.
 */


$(document).ready(function() {

    var smoothie = new SmoothieChart();
    smoothie.streamTo(document.getElementById("mycanvas"));

    // Data
    var line1 = new TimeSeries();
    var line2 = new TimeSeries();

    // Add a random value to each line every second
    setInterval(function() {
        line1.append(new Date().getTime(), Math.random());
        line2.append(new Date().getTime(), Math.random());
    }, 1000);

    // Add to SmoothieChart
    smoothie.addTimeSeries(line1);
    smoothie.addTimeSeries(line2);
});