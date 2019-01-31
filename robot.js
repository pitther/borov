let robot = require("robotjs");
const hexRgb = require('hex-rgb');
const chalk = require('chalk');

let BRAIN = require("brain");
var net = new brain.NeuralNetwork();
robot.setMouseDelay(2);

var screenSize = robot.getScreenSize();
var height = (screenSize.height / 2) - 10;
var width = screenSize.width;
let cnt = 0;

const log_mouse = false;
const LOG_HASHMAP = true;
const LOG_HASHMAP_HOT = false;

const LINE_POS = 380;

const START_LINE = 740;
const END_LINE = 1360;

const IMG_LENGTH = END_LINE-START_LINE;
const IMG_HEIGHT = 30;

let inv = setInterval(function(){
    if (log_mouse){
        var mouse = robot.getMousePos();
        console.log("Mouse is at x:" + mouse.x + " y:" + mouse.y);
    }
    //var img = robot.screen.capture(0, 0, screenSize.width, screenSize.height );
    var img = robot.screen.capture(START_LINE, LINE_POS-IMG_HEIGHT, IMG_LENGTH, IMG_HEIGHT);
    BOT.parseImage(img);

    cnt++;



    if (cnt > 100000){
        clearInterval(inv);
    }

},1);



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

        this.action();

        this.jumpRangeLow += .0000000005;
        this.jumpRangeHigh += .00000000005;
    }
    action(){
        for (let i = 0; i < this.hashMapLow.length; i++){
            if (i < this.jumpRangeLow && this.hashMapLow[i] == 1){
                DINO.jump(0,500);
                DINO.duck(200,200);
                break;
            } else if (i < this.jumpRangeHigh && this.hashMapHigh[i] == 1){
                DINO.jump(0,500);
                DINO.duck(230,200);
                break;
            } else if ( DINO.jumping && this.hashMapHigh[3] != 2){
                break;
            }

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
