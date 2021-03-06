//cv-edge-detection computational creativity
let capture;
let img;
let buffer;
let result;
let w = 480,
    h = 480;
let rightBuffer, leftBuffer;
let coordinates = [];
let bool = true;

function setup() {
    //camera capture
    frameRate(25);
    capture = createCapture({
        audio: false,
        video: {
            width: w,
            height: h
        }
    }, function() {
        console.log('capture ready.')
    });
    capture.elt.setAttribute('playsinline', '');
    // 800 x 400 (double width to make room for each "sub-canvas")
    createCanvas(w*2, h);
    // Create both of your off-screen graphics buffers
    rightBuffer = createGraphics(w, h);
    leftBuffer = createGraphics(w, h);
    capture.size(w, h);
    capture.hide();
    buffer = new jsfeat.matrix_t(w, h, jsfeat.U8C1_t);
    //right drawing
}

function jsfeatToP5(src, dst) {
    if (!dst || dst.width !== src.cols || dst.height !== src.rows) {
        dst = createImage(src.cols, src.rows);
    }
    let n = src.data.length;
    dst.loadPixels();
    let srcData = src.data;
    let dstData = dst.pixels;
    for (var i = 0, j = 0; i < n; i++) {
        var cur = srcData[i];
        dstData[j++] = cur;
        dstData[j++] = cur;
        dstData[j++] = cur;
        dstData[j++] = 255;
    }
    dst.updatePixels();
    return dst;
}

function raster(rastNumb) {
    //numb is input of raster
    let numb = floor(rastNumb/10)*10; //rounded
    if (numb === 50){//50 makes mistake so make 60
        numb = 60;
    }
    let numbX = numb;
    let numbY = numb;
    stroke('rgba(0,255,0,0.25)'); //green color
    strokeWeight(2);
    let xN = floor(w/numbX);
    let yN = floor(h/numbY);
    //detect colors
    colorDetection(numbX,numbY,xN,yN);
}

function colorDetection(numbX,numbY,xN,yN) {
    //color detector if white draw circle
    //and put in array
    let arrInd = 0;
    let index = 0;
    let rgba = [];
    let black = color('rgba(0,0,0,1)');
    let c = color(255, 69, 0);
    noStroke();
    // load pixels
    loadPixels();
    let count = 0;
    let cut = ((w*4)*2);
    //paxel is new pixel;
    let paxel = [];
    for (let t = 0; t < pixels.length; t++) {
        if (count <= cut ) {
            paxel.push(pixels[t]);
        } else if (count > (cut*2)-1){
            count = 0;
        }
        count++
    }
    //plus for the extra screen
    let xPixel = (4 * xN * 2);
    let yPixel = ((yN*2)*(4 * w)*2) ;
    for (let i = 1; i < numbY; i++) {
        for (let j = 1; j < numbX; j++) {
            // loop over
            index = (xPixel*j)+(yPixel*i);
            let x = xN * j;
            let y = yN * i;
            rgba[0] = paxel[index];
            rgba[1] = paxel[index + 1];
            rgba[2] = paxel[index + 2];
            rgba[3] = paxel[index + 3];
            //pixel checker
            if (!arraysEqual(black.levels,rgba)){
                fill(c);
                ellipse(x, y, 6);
                //push array
                if (arrInd === 0) {
                    coordinates = [];
                }
                coordinates.push({'i': arrInd,'x': x, 'y': y })
                arrInd++;
            } else {
                fill(0);
            }
        }
    }
    paxel.length = 0;
}

function arraysEqual(a1,a2) {
    /* WARNING: arrays must not contain {objects} or behavior may be undefined */
    return JSON.stringify(a1)===JSON.stringify(a2);
}

function draw() {
    // Draw on your buffers however you like
    drawLeftBuffer();
    drawRightBuffer();
    // Paint the off-screen buffers onto the main canvas
    image(leftBuffer, 0, 0);
    image(rightBuffer, 480, 0);
}

function drawLeftBuffer() {
    image(capture, 0, 0, 480, 480);
    capture.loadPixels();
    if (capture.pixels.length > 0) { // don't forget this!
        result = jsfeatToP5(buffer, result);
        image(result, 0, 0, 480, 480)
        //initiate sliders
        let blurSize = select('#blurSize').elt.value;
        let lowThreshold = select('#lowThreshold').elt.value;
        let highThreshold = select('#highThreshold').elt.value;
        let rast = select('#raster').elt.value;
        //map sliders
        blurSize = map(blurSize, 0, 100, 1, 10); //max 12
        lowThreshold = map(lowThreshold, 0, 100, 0, 155); // max 255
        highThreshold = map(highThreshold, 0, 100, 0, 155); //max 255
        rast = map(rast, 0, 100, 10, 60);
        //use openCV
        jsfeat.imgproc.grayscale(capture.pixels, w, h, buffer);
        jsfeat.imgproc.gaussian_blur(buffer, buffer, blurSize, 0);
        jsfeat.imgproc.canny(buffer, buffer, lowThreshold, highThreshold);

        raster(rast);
    }
}

function map3D(mapper){
    //map
    return map(mapper, 0, 480, 0, 9);
}

function drawRightBuffer() {
    sortOnX(); //point system
    makeFunctionNodes(); //initiate points
    cSystem(); //creative system
    let backgroundColour = color(0, 0, 0);
    rightBuffer.background(backgroundColour); // overdraws the previous orientations at the loop rate

    if (bool === true){
        rightBuffer.translate(25, h/3.5);
        rightBuffer.scale(0.65);
        bool = false;
    }
    for (let i=0; i < nodes.length; i++) {
        let px = nodes[i][0];
        let py = nodes[i][1];
        let pz = floor(zAxis[i]); //floor axis
        rightBuffer.fill(nodeColour[pz]);
        rightBuffer.noStroke();
        // the "pixels" are small rectangles which is faster than rendering small circles.
        rightBuffer.rect(px*fscale,py*fscale,nodeSize,nodeSize)
    }
    //empty z axis
    zAxis.length = 0;
    // Draw axes
    rightBuffer.stroke('white');
    rightBuffer.fill('white');
    rightBuffer.textSize(16);
    rightBuffer.line(nodesAxes[0][0]*fscale,nodesAxes[0][1]*fscale,nodesAxes[1][0]*fscale,nodesAxes[1][1]*fscale);
    rightBuffer.text("x",nodesAxes[1][0]*fscale,nodesAxes[1][1]*fscale);
    rightBuffer.line(nodesAxes[0][0]*fscale,nodesAxes[0][1]*fscale,nodesAxes[2][0]*fscale,nodesAxes[2][1]*fscale);
    rightBuffer.text("y",nodesAxes[2][0]*fscale,nodesAxes[2][1]*fscale);
    rightBuffer.line(nodesAxes[0][0]*fscale,nodesAxes[0][1]*fscale,nodesAxes[3][0]*fscale,nodesAxes[3][1]*fscale);
    rightBuffer.text("z",nodesAxes[3][0]*fscale,nodesAxes[3][1]*fscale);
}

//change slider
function cSystem() {
    let raster = parseInt(document.getElementById("raster").value)
    let blur = parseInt(document.getElementById("blurSize").value)
    let lowT = parseInt(document.getElementById("lowThreshold").value)
    let highT = parseInt(document.getElementById("highThreshold").value)

    //array highest values
    let upper = [];
    for (let i = 0; i < zAxis.length; i++) {
        if (zAxis[i] > 7) {
            upper.push(zAxis[i]);
        }
    }
    //change raster
    if (upper.length < 1) {
        raster = raster + 10;
    } else if (upper.length > 45) {
        raster = raster - 10;
    } else {
        raster = document.getElementById("raster").value;
    }
    //mutator
    blur = blur + Math.floor(Math.random()*5)-2;
    lowT = lowT + Math.floor(Math.random()*3)-1;
    highT = highT + Math.floor(Math.random()*3)-1;

    //change values
    document.getElementById("blurSize").value =  blur.toString();
    document.getElementById("lowThreshold").value = lowT.toString();
    document.getElementById("highThreshold").value = highT.toString();
    document.getElementById("raster").value = raster.toString();
}

function printToCSV(){
    coordinates.sort(function (a, b) {
        return a.i - b.i;
    })

    table = new p5.Table();
    //set table header
    table.addColumn('point');
    table.addColumn('x');
    table.addColumn('y');
    table.addColumn('z');
    //load all values in table
    let tableRow = table.addRow();
    for (let i = 0; i < coordinates.length; i++){
        tableRow.setString('point', coordinates[i].i);
        tableRow.setString('x', coordinates[i].x);
        tableRow.setString('y', coordinates[i].y);
        tableRow.setString('z', floor(map(zAxisPlot(i),0,9,0,480)));
        tableRow = table.addRow();
    }
    saveTable(table, 'tableOutput', 'csv'); //could also be downloaded as tsv or html
}

