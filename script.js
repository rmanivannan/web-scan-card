
//-1, -1     0, -1   1, -1
//- 1, 0     0, 0    1, 0
//- 1, 1     0, 1    1, 1

(function () {
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    var ccImg = document.getElementById('ccImg');
    var boolImg = [[]];
    var bits = [];
    var bitIndex = 0;
    var buffer = 1; // closeness
    var iterations = 7;
    var ignoreNoicePixcelsIflessersize = 10;
    var smootThreshold = 6; // if more than smootThreshold sourandings are white, center cell also will be white
    var numberOfsmoothIteration = 4;
    var grayscaleThreshold = 100; // half of 256 = 2^8 - need some logic to get for particular image, number of pixcels vs grey scall(0-255)
    var colors = [
        [255, 0, 0],
        [255, 255, 255]
    ];

    ccImg.crossOrigin = 'Anonymous';
    
    
    // Read image
    setTimeout(() => {
        context.drawImage(ccImg, -50, -150, 400,400);
    }, 100);


    // Convert to black&white
    setTimeout(() => {
        convertColorToBW(context);
    }, 1000);


    function convertColorToBW(cxt){
        var w = canvas.width;
        var h = canvas.height;

        w = 300;
        h = 130;
        var imgPixels = cxt.getImageData(0, 0, w, h);
        
        
        for (var i = 0; i < imgPixels.data.length; i += 4) {
            var avg = (imgPixels.data[i] + imgPixels.data[i + 1] + imgPixels.data[i + 2]) / 3;
            avg = avg >= grayscaleThreshold ? 255 : 0;

        
            var boolVal = avg == 0 ? 0 : 1;
            bits[i/4] = boolVal;

            imgPixels.data[i] = avg;
            imgPixels.data[i + 1] = avg;
            imgPixels.data[i + 2] = avg;

        }

        drowImg(cxt, imgPixels);



        // fill the gaps / Blur it before applaying skelitons
        // NOT in use
        // Need improvement



        while (numberOfsmoothIteration !=0 ) {
            numberOfsmoothIteration --
            for (var i = 0; i < imgPixels.height; i++) {
                for (var j = 0; j < imgPixels.width; j++) {
                    var index = getIndexFromPos(j, i);//(i * 4) * imgPixels.width + j * 4;
                    var bitsInx = index / 4;
                    if (bits[bitsInx] == 0) {
                        fillGaps(j, i, bitsInx);
                    }
                }
            }
            drowImg(cxt, imgPixels);
        }

            
        function fillGaps(x, y, bitsInx) {
            //if 2 or more more white sroundeded  
            var sumOfWhites =   isWhite(x-1 , y-1 ) +
                                isWhite(x,    y-1 ) +
                                isWhite(x+1,  y-1 ) +
                                isWhite(x- 1, y   ) +
                                isWhite(x+1,  y   ) +
                                isWhite(x- 1, y+1 ) +
                                isWhite(x,    y+1 ) +
                                isWhite(x+1,  y+1 );

            if (sumOfWhites >= smootThreshold){
                bits[bitsInx] = 1; // set white
                imgPixels.data[bitsInx * 4    ] = 255;
                imgPixels.data[bitsInx * 4 + 1] = 0;
                imgPixels.data[bitsInx * 4 + 2] = 0;
            }
        }

        function isWhite(x,y) {
            return bits[getIndexFromPos(x, y) / 4] == 1 ? 1:0;
        }


        
        


        // Skeletonization || thinning
        // Need improvement

        var morph = new Morph(imgPixels.width, imgPixels.height, bits)
        morph.iterativeThinning(iterations);

        for (var i = 0; i < imgPixels.data.length; i += 4) {
            var avg = bits[i / 4] == 0 ? 0 : 255;
            imgPixels.data[i] = avg;
            imgPixels.data[i + 1] = avg;
            imgPixels.data[i + 2] = avg;

        }
        drowImg(cxt, imgPixels);

        
        
        


        // Splitting connected pics as groups

        var arAr = [[]];

        var matchList = [
            // [{x,y},{0,1},{1,1},{2,1}] - item 1
             //[ {x,y}, {10,11},{11,11},{12,11}] - item 2
        ];

        for (var i = 0; i < imgPixels.height; i++) {
            for (var j = 0; j < imgPixels.width; j++) {
                var index = (i * 4) * imgPixels.width + j * 4;
                if (bits[index/4] == 1){
                    addTomatchList(j,i);

                    imgPixels.data[index] = 255;
                    imgPixels.data[index + 1] = 0;
                    imgPixels.data[index+ 2] = 0; 
                }
                /* if (i % 2 == 0 || j % 2 == 0){
                    imgPixels.data[index] = 255;
                    imgPixels.data[index + 1] = 255;
                    imgPixels.data[index + 2] = 0; 
                } */
            }
        }

        function getIndexFromPos(x,y) {
            return (y * 4) * imgPixels.width + x * 4;
        }
        
        function addTomatchList(x,y) {
            var foundMatch = false;
            for (var i=0;i< matchList.length;i++){
                var item = matchList[i];
                if(item){
                    var temp = JSON.stringify(item)
                    
                    if(
                            temp.indexOf(JSON.stringify({ x: x-1, y: y-1 })) >=0 ||
                            temp.indexOf(JSON.stringify({ x: x, y: y-1 })) >=0 ||
                            temp.indexOf(JSON.stringify({ x: x+1, y: y-1 })) >=0 ||
                            temp.indexOf(JSON.stringify({ x: x-1, y: y })) >=0 ||
                            temp.indexOf(JSON.stringify({ x: x+1, y: y })) >=0 ||
                            temp.indexOf(JSON.stringify({ x: x-1, y: y+1 })) >=0 ||
                            temp.indexOf(JSON.stringify({ x: x, y: y+1 })) >=0 ||
                            temp.indexOf(JSON.stringify({ x: x + 1, y: y + 1 }))>= 0 
                    ){

                        foundMatch = true;
                        item.push({
                            x: x,
                            y: y
                        });
                        return;

                        }
                    
                }
            }
            if (!foundMatch){
                matchList.push([{
                    x: x,
                    y: y
                }])
            }
            
        } 

        drowImg(cxt, imgPixels);


        // Display each groups with diff colors

        for (var i in matchList) {
            var item = matchList[i];
            if (item) {
                for (var j in item) {
                    var pos = item[j];
                    var ind = getIndexFromPos(pos.x, pos.y);
                    imgPixels.data[ind] = colors[i%2][0];
                    imgPixels.data[ind + 1] = colors[i%2][1];
                    imgPixels.data[ind + 2] = colors[i%2][2]; 
                }
            }
        }
        
        console.log('groups count', matchList.length, matchList);
        drowImg(cxt, imgPixels);


        matchList = matchList.filter(function name(a) {
            return (a.length > ignoreNoicePixcelsIflessersize && a.length < 1000);
        })

        // mergigng nearset groups 

        var rectEdges = matchList.map(function (a) {
            

            var temp = {
                minX: a[0].x,
                minY: a[0].y,
                maxX: a[0].x,
                maxY: a[0].y
            };

            for(var i in a){
                var pos = a[i];
                if(pos.x > temp.maxX){
                    temp.maxX = pos.x;
                }
                if (pos.y > temp.maxY) {
                    temp.maxY = pos.y;
                }
                if (pos.x < temp.minX) {
                    temp.minX = pos.x;
                }
                if (pos.y < temp.minY) {
                    temp.minY = pos.y;
                }
            }

            
            return {
                minX: temp.minX - buffer,
                minY: temp.minY - buffer,
                maxX: temp.maxX + buffer,
                maxY: temp.maxY + buffer
            };
        });


        for (var i =0;i< rectEdges.length-1;i++){
            var rect1 = rectEdges[i];
            if(rect1){
                for (var j = i; j < rectEdges.length - 1; j++) {
                    var rect2 = rectEdges[j];
                    if (i != j && rect2 && rect1 && isIntersectRects(rect1, rect2)){
                        matchList[i] = matchList[i] && matchList[i].concat(matchList[j]);
                        matchList[j] = null;
                    }
                }
            }
        }

        function isIntersectRects(r1, r2) {
            return !(r2.minX > r1.maxX ||
                r2.maxX < r1.minX ||
                r2.minY > r1.maxY ||
                r2.maxY < r1.minY);
        }

        matchList = matchList.filter(function (a) {
            return !!a;
        })

        //wipeout
        for(var i in bits){
            imgPixels.data[i*4] = 0;
            imgPixels.data[i*4+1] = 0;
            imgPixels.data[i*4+2] = 0;
        };

        for (var i in matchList) {
            var item = matchList[i];
            if (item) {
                for (var j in item) {
                    var pos = item[j];
                    if (pos){
                        var ind = getIndexFromPos(pos.x, pos.y);
                        imgPixels.data[ind] = colors[i % 2][0];
                        imgPixels.data[ind + 1] = colors[i % 2][1];
                        imgPixels.data[ind + 2] = colors[i % 2][2];
                    }
                }
            }
        }
        
        console.log('length after mergging close groups', matchList.length, matchList);
        drowImg(cxt, imgPixels);

    }

    function drowImg(cxt, imgPixels) {
        //alert('OK')
        cxt.putImageData(imgPixels, 0, 0, 0, 0, imgPixels.width, imgPixels.height);
    }

})();
