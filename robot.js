

let robot = require("robotjs");
const hexRgb = require('hex-rgb');
const chalk = require('chalk');

let JSONFILE = require("jsonfile");
const train_file = '/train_data/data.json'

let BRAIN = require("brainjs");

robot.setMouseDelay(2);

var screenSize = robot.getScreenSize();
var height = (screenSize.height / 2) - 10;
var width = screenSize.width;
let cnt = 0;

const FLUSH_TRAIN_DATA = false;
const BOT_PLAY = true;
const log_mouse = false;
const LOG_HASHMAP = true;
const LOG_HASHMAP_HOT = true;

const LINE_POS = 380;

const START_LINE = 740;
const END_LINE = 1360;

const IMG_LENGTH = END_LINE-START_LINE;
const IMG_HEIGHT = 30;


if (FLUSH_TRAIN_DATA){
    let obj = {layers:[]}
    JSONFILE.writeFileSync(__dirname + train_file, obj);
}


let inv = setInterval(function(){
    if (log_mouse){
        var mouse = robot.getMousePos();
        console.log("Mouse is at x:" + mouse.x + " y:" + mouse.y);
    }
    //var img = robot.screen.capture(0, 0, screenSize.width, screenSize.height );
    var img = robot.screen.capture(START_LINE, LINE_POS-IMG_HEIGHT, IMG_LENGTH, IMG_HEIGHT);
    BOT.parseImage(img);

    cnt++;

    if (cnt > 1000000000){
        //clearInterval(inv);
    }

},1);

setInterval(function(){
    robot.keyTap("enter");
},1000)



class GameBot{
    constructor(){
        this.logHashMap = LOG_HASHMAP;

        this.lineLength = IMG_LENGTH;

        this.hashMapLow = [];
        this.hashMapHigh = [];
        this.t = 9;
        this.step =  this.lineLength/this.t;

        this.inverted = false;

        this.jumpRangeLow = 8;
        this.jumpRangeHigh = 8;

        this.prevHashMapHigh = [];

        this.net = new BRAIN.NeuralNetwork();

        this.current_score = 0;
        this.load_train_data();

        setInterval(function(){
            if (!BOT_PLAY){
                this.save_train_data();
            }
        }.bind(this),1000*2);
    }
    blackAt(img,x,y){
        let hex = img.colorAt(x, y);
        let rgba = hexRgb(hex);
        if ( (rgba.red+rgba.green+rgba.blue)/(256*3) < 0.5 ){
            return true;
        } else {
            return false;
        }
    }
    blackAtRange(img,x,y){
        for (let i = x; i < x+this.t-1; i++){
            let hex = img.colorAt(i, y);
            let rgba = hexRgb(hex);
            if ( (rgba.red+rgba.green+rgba.blue)/(768) < 0.5 ){
                return true;
            }
        }
        return false;
    }

    parseImage(img){
        this.hashMapLow = [];
        this.hashMapHigh = [];
        let black;
        let black_cnt = 0;
        for (let i = 0; i < this.step; i++){
            let x = this.t*i;

            //HIGH
            if (!this.inverted){
                black = this.blackAtRange(img,x,1);
            } else {
                black = !this.blackAtRange(img,x,1);
            }

            if ( black && x < 50){
                this.hashMapHigh.push(2);
            } else if ( black ) {
                this.hashMapHigh.push(1);
            } else {
                this.hashMapHigh.push(0);
            }

            //LOW
            if (!this.inverted){
                black = this.blackAtRange(img,x,IMG_HEIGHT-1);
            } else {
                black = !this.blackAtRange(img,x,IMG_HEIGHT-1);
            }
            if ( black && x < 50){
                this.hashMapLow.push(2);
            } else if ( black ) {
                black_cnt++;
                this.hashMapLow.push(1);
            } else {
                this.hashMapLow.push(0);
            }

        }
        if (black_cnt > 20){
            this.inverted = !this.inverted;
            this.jumpRangeLow += 1;
            this.jumpRangeHigh += 1;
            console.log("INVERTED");
            return 0;
        }

        if (this.logHashMap){
            let strLow = "";
            let strHigh = "";

            for (let i = 0; i < this.hashMapLow.length; i++){
                let eL = this.hashMapLow[i];
                if (eL == 0){
                    strLow += chalk.bgWhite(" ");
                } else if (eL == 1){
                    strLow += chalk.bgRed(" ");
                } else if (eL == 2){
                    strLow += chalk.bgMagenta(" ");
                }

                let eH = this.hashMapHigh[i];
                if (eH == 0){
                    strHigh += chalk.bgWhite(" ");
                } else if (eH == 1){
                    strHigh += chalk.bgCyan(" ");
                } else if (eH == 2){
                    strHigh += chalk.bgMagenta(" ");
                }

            }
            if (LOG_HASHMAP_HOT){
                console.log("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n");
            } else {
                console.log();
            }
            console.log(strHigh);
            console.log(strLow);
        }

        if (cnt % 100 == 1 && black_cnt > 2 && isEqual(this.prevHashMapHigh, this.hashMapHigh)){
            this.restart_game();
            //process.exit();
        }

        if (cnt % 100 == 1){
            this.prevHashMapHigh = this.hashMapHigh;
        }

        if (BOT_PLAY){
            this.action_net();
        } else {
            this.action();
        }


        //this.jumpRangeLow += .0000000005;
        //this.jumpRangeHigh += .00000000005;
    }
    restart_game(){
        console.log("restart");
        robot.keyTap("enter");
        //this.train_run();
    }
    train_run(){
        let data = this.train_data;
        this.net.train([ data ],{
                                                    // Defaults values --> expected validation
                              iterations: 200000,    // the maximum times to iterate the training data --> number greater than 0
                              errorThresh: 0.005,   // the acceptable error percentage from training data --> number between 0 and 1
                              learningRate: 0.3,    // scales with delta to effect training rate --> number between 0 and 1
                              momentum: 0.1,        // scales with next layer's change value --> number between 0 and 1
                              callbackPeriod: 10,   // the number of iterations through the training data between callback calls --> number greater than 0
                              timeout: Infinity     // the max number of milliseconds to train for --> number greater than 0
                        });
    }
    training(output){
        let input = this.hashMapLow.concat(this.hashMapHigh) ;
        this.train_data.push({input: input, output: output} );
    }
    train(output){
        let input = this.hashMapLow.concat(this.hashMapHigh) ;
        this.net.train([ {input: input, output: output}  ],{
                                                    // Defaults values --> expected validation
                              iterations: 200000,    // the maximum times to iterate the training data --> number greater than 0
                              errorThresh: 0.005,   // the acceptable error percentage from training data --> number between 0 and 1
                              learningRate: 0.3,    // scales with delta to effect training rate --> number between 0 and 1
                              momentum: 0.1,        // scales with next layer's change value --> number between 0 and 1
                              callbackPeriod: 10,   // the number of iterations through the training data between callback calls --> number greater than 0
                              timeout: Infinity     // the max number of milliseconds to train for --> number greater than 0
                        });
    }
    save_train_data(){
        let obj = this.net.toJSON();

        JSONFILE.writeFile(__dirname + train_file, obj, function (err) {
          if (err) console.error(err)
        })

    }
    load_train_data(){
        this.net.fromJSON(JSONFILE.readFileSync(__dirname + train_file));
    }
    action(){
        let trained = false;
        for (let i = 0; i < this.hashMapLow.length; i++){
            if (i < this.jumpRangeLow && this.hashMapLow[i] == 1){
                DINO.jump(0,500);
                //DINO.duck(200,200);
                trained = true;
                this.train({jump: 1, duck: 0, idle: 0});
                break;
            } else if (i < this.jumpRangeHigh && this.hashMapHigh[i] == 1){
                DINO.jump(0,500);
                //DINO.duck(230,200);
                trained = true;
                this.train({jump: 1, duck: 0, idle: 0});
                break;
            } else if ( DINO.jumping && this.hashMapHigh[3] != 2){
                break;
            }

        }
        if (!trained){
            this.train({jump: 0, duck: 0, idle: 1});
        }

        console.log( this.net.run(this.hashMapLow.concat(this.hashMapHigh) ) );
        DINO.update_log();

    }
    action_net(){
        let output = this.net.run( this.hashMapLow.concat(this.hashMapHigh) );
        console.log(output);
        let arr = [output.jump, output.duck, output.idle]

        if ( output.jump == Math.max.apply(null,arr) ){
            //console.log("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n");
            DINO.jump(0,500);
        } else {

        }
        DINO.update_log();
    }
}

class Dino{
    constructor(){
        this.crouching = false;
        this.jumping = false;
    }
    update_log(){
        if (this.crouching){
            console.log(cnt,"Action: crouching");
        } else if (this.jumping){
            console.log(cnt,"Action: jumping");
        } else {
            console.log(cnt,"Action: none");
        }
    }
    jump(del,dur){
        if (!this.jumping){
            setTimeout(function(){
                this.jumping = true;
                robot.keyToggle("up", "down");
                setTimeout(function(){
                    this.jumping = false;
                    robot.keyToggle("up", "up");
                }.bind(this),dur);
            }.bind(this),del);
            return true;
        } else {
            return false;
        }
    }
    duck(del,dur){
        if (!this.crouching){
            setTimeout(function(){
                this.crouching = true;
                robot.keyToggle("down", "down");
                setTimeout(function(){
                    this.crouching = false;
                    robot.keyToggle("down", "up");
                }.bind(this),dur);
            }.bind(this),del);
        }
    }
}

let DINO = new Dino();
let BOT = new GameBot();

var isEqual = function (value, other) {

	// Get the value type
	var type = Object.prototype.toString.call(value);

	// If the two objects are not the same type, return false
	if (type !== Object.prototype.toString.call(other)) return false;

	// If items are not an object or array, return false
	if (['[object Array]', '[object Object]'].indexOf(type) < 0) return false;

	// Compare the length of the length of the two items
	var valueLen = type === '[object Array]' ? value.length : Object.keys(value).length;
	var otherLen = type === '[object Array]' ? other.length : Object.keys(other).length;
	if (valueLen !== otherLen) return false;

	// Compare two items
	var compare = function (item1, item2) {

		// Get the object type
		var itemType = Object.prototype.toString.call(item1);

		// If an object or array, compare recursively
		if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
			if (!isEqual(item1, item2)) return false;
		}

		// Otherwise, do a simple comparison
		else {

			// If the two items are not the same type, return false
			if (itemType !== Object.prototype.toString.call(item2)) return false;

			// Else if it's a function, convert to a string and compare
			// Otherwise, just compare
			if (itemType === '[object Function]') {
				if (item1.toString() !== item2.toString()) return false;
			} else {
				if (item1 !== item2) return false;
			}

		}
	};

	// Compare properties
	if (type === '[object Array]') {
		for (var i = 0; i < valueLen; i++) {
			if (compare(value[i], other[i]) === false) return false;
		}
	} else {
		for (var key in value) {
			if (value.hasOwnProperty(key)) {
				if (compare(value[key], other[key]) === false) return false;
			}
		}
	}

	// If nothing failed, return true
	return true;

};
