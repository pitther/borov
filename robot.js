let robot = require("robotjs");
const hexRgb = require('hex-rgb');
const chalk = require('chalk');

robot.setMouseDelay(2);

var screenSize = robot.getScreenSize();
var height = (screenSize.height / 2) - 10;
var width = screenSize.width;
let cnt = 0;
let inv = setInterval(function(){
    var mouse = robot.getMousePos();
    //console.log("Mouse is at x:" + mouse.x + " y:" + mouse.y);
    //var img = robot.screen.capture(0, 0, screenSize.width, screenSize.height );
    var img = robot.screen.capture(740, 380, 1359, 381);
    if (cnt % 200)
        BOT.parseImage(img);

    cnt++;

    if (cnt > 1000){
        clearInterval(inv);
    }

},1);



class GameBot{
    constructor(){
        this.gmLine = {x:740, y:380};
        this.gmLineEnd = {x:1359, y:380};

        this.hashMap = [];
        this.t = 20;
        this.step =  ((this.gmLineEnd.x-this.gmLine.x)/this.t);
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
        for (let i = x; i < x+this.t; i++){
            let hex = img.colorAt(i, y);
            let rgba = hexRgb(hex);
            if ( (rgba.red+rgba.green+rgba.blue)/(768) < 0.5 ){
                return true;
            }
        }
        return false;
    }
    parseImage(img){
        this.hashMap = [];

        for (let i = 0; i < this.step; i++){
            let x = (this.gmLine.x)+this.t*i;
            let black = this.blackAt(img,x,this.gmLine.y);
            if ( black && x-this.gmLine.x < 30){
                this.hashMap.push(2);
            } else if ( black ) {
                this.hashMap.push(1);
            } else {
                this.hashMap.push(0);
            }
        }

        let str = "";

        for (let i = 0; i < this.hashMap.length; i++){
            let e = this.hashMap[i];
            if (e == 0){
                str += chalk.bgWhite(" ");
            } else if (e == 1){
                str += chalk.bgRed(" ");
            } else if (e == 2){
                str += chalk.bgMagenta(" ");
            }

        }

        console.log();
        console.log(str);
        this.action();
    }
    action(){
        for (let i = 0; i < this.hashMap.length; i++){
            if (i < 10 && this.hashMap[i] == 1){
                DINO.jump(500);

                break;
            }

        }



    }
}

class Dino{
    constructor(){
        this.jumping = false;
    }
    jump(dur){
        if (!this.jumping){
            this.jumping = true;
            console.log("jump");
            robot.keyToggle("up", "down");
            setTimeout(function(){
                this.jumping = false;
                robot.keyToggle("up", "up");
            }.bind(this),dur);
        }
    }
    down(dur){
        robot.keyToggle("down", "down");
        setTimeout(function(){
            robot.keyToggle("down", "up");
        }.bind(this),dur);
    }
}

let DINO = new Dino();
let BOT = new GameBot();
