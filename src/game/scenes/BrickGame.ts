import { EventBus } from '../EventBus';
import { Scene, Textures } from 'phaser';

const gameWidth = 1024;
const gameHeight = 768;

const paddleWidth = 100;
const paddleHeight = 30;
const paddleColor = 0xdddddd;
const backgroundColor = 0x000000;
const wallColor = 0x888888;
const wallWidth = 20;
const ballRadius = 13;
const ballColor = 0x886644;

const paddleWallDistance = 100;
const inPaddleX = 400;
const inPaddle2Y = paddleWallDistance;
const inPaddle1Y = (gameHeight - inPaddle2Y);; 
const inPaddle3X = paddleWallDistance;
const inPaddle4X = (gameWidth - inPaddle3X);

const inBallX = 100;
const inBallY = 200;
const inBallVX = 510;
const inBallVY = 470;

const paddleAccel = 4000;
const paddleDrag = 0.0002;
const maxBallVx = 750;
const maxPaddleVx = 2000;
const paddleBounce = 0.34;

const nGames = 4;

const G3areaRadius = 45;
const G3areaColor = 0x00ff00;
const G3areaOpacity = 0.2;

// 0 is horizontal, 1 is vertical
const collidePaddleBall = (paddle:any, ball:any, dir:number) => {
    let vx = ball.body.velocity.x;
    let vy = ball.body.velocity.y;
    let bx = ball.x;
    let by = ball.y;
    let px = paddle.x;
    let py = paddle.y;

    let paddleVX = paddle.body.velocity.x;
    let paddleVY = paddle.body.velocity.y;

    if (dir == 1) {
        let p;
        p = vx;
        vx = vy;
        vy = p;

        p = bx;
        bx = by;
        by = p;

        p = px;
        px = py;
        py = p;

        p = paddleVX;
        paddleVX = paddleVY;
        paddleVY = p;
    }

    if (Math.abs(by - py) > (ballRadius + paddleHeight/2) - 1) {
        // top or bottom collision
        if (bx > py)
            by = py + (ballRadius + paddleHeight/2) + 1;
        else
            by = py - (ballRadius + paddleHeight/2) - 1;
        
        if (bx > px + paddleWidth/2 + ballRadius)
            vx = Math.abs(vx);
        else if (bx < px - ballRadius)
            vx = -Math.abs(vx);
        else {
            // near the middle of the paddle. no velocity change
        }
        vy = -vy;
    }
    else {
        //side collision
        const ballVx = vx;
        if (Math.sign(ballVx) == Math.sign(paddleVX))
        {
            vx = -(vx + paddleVX);
            vx = Math.min(vx, maxBallVx);
            vx = Math.max(vx, -maxBallVx);
        }
        else
        {
            vx = -vx;
            vx = Math.min(vx, maxBallVx);
            vx = Math.max(vx, -maxBallVx);
        }
    }
    ball.setVelocityX(dir == 0 ? vx : vy);
    ball.setVelocityY(dir == 0 ? vy : vx);
};

const collideHPaddleBall = (paddle:any, ball:any) => collidePaddleBall(paddle, ball, 0);
const collideVPaddleBall = (paddle:any, ball:any) => collidePaddleBall(paddle, ball, 1);

export class BrickGame extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    balls: Array<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>;
    paddles: Array<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>;
    //ballTex: Phaser.Textures.DynamicTexture;
    //paddleTex: Phaser.Textures.DynamicTexture;
    gameId: number;

    constructor ()
    {
        super('BrickGame');
    }

    setupPaddles () {
        for (const paddle of this.paddles) {
            paddle.setBounce(paddleBounce);
            paddle.setCollideWorldBounds(true);
            paddle.body.setMaxSpeed(maxPaddleVx);
            paddle.body.setAllowDrag(true);
            paddle.body.setDamping(true);
            paddle.body.setDrag(paddleDrag, 0);
        }
    }

    reset () {
        this.balls = [];
        this.paddles = [];
    }

    // simplest game : paddle, ball
    initGame0()
    {
        const paddle = this.physics.add.sprite(inPaddleX, inPaddle1Y, 'paddle');
        this.paddles = [paddle];

        const ball = this.physics.add.sprite(inBallX, inBallY, 'ball');
        ball.setCollideWorldBounds(true);
        ball.setBounce(1);
        ball.setCircle(ballRadius, 0, 0);
        this.balls = [ball];

        this.physics.add.overlap(paddle, ball, collideHPaddleBall);

        ball.setVelocityX(inBallVX);
        ball.setVelocityY(inBallVY);
    }

    // 2 paddles : top and bottom
    initGame1()
    {
        const paddle1 = this.physics.add.sprite(inPaddleX, inPaddle1Y, 'paddle');
        const paddle2 = this.physics.add.sprite(inPaddleX, (gameHeight - inPaddle1Y), 'paddle');
        this.paddles.push(paddle1);
        this.paddles.push(paddle2);

        const ball = this.physics.add.sprite(inBallX, inBallY, 'ball');
        ball.setCollideWorldBounds(true);
        ball.setBounce(1);
        ball.setCircle(ballRadius, 0, 0);
        this.balls = [ball];

        for (const paddle of this.paddles) {
            this.physics.add.overlap(paddle, ball, collideHPaddleBall);
        }

        ball.setVelocityX(inBallVX);
        ball.setVelocityY(inBallVY);
    }

    // bonus / malus area in the middle
    initGame2()
    {
        const areaGraphics = this.make.graphics({}, false);
        areaGraphics.fillStyle(G3areaColor, G3areaOpacity);
        areaGraphics.fillCircle(G3areaRadius, G3areaRadius, G3areaRadius);

        const areaTex = this.textures.addDynamicTexture('area', G3areaRadius*2, G3areaRadius*2);
        if (!areaTex)
            throw new Error("texture creation error");
        areaTex.draw(areaGraphics);

        const area = this.make.image({x:gameWidth/2, y:gameHeight/2 , key:'area'});
        this.initGame1();
    }

    initGame3()
    {
        const paddle0 = this.physics.add.sprite(inPaddleX, inPaddle1Y, 'paddle');
        const paddle1 = this.physics.add.sprite(inPaddleX, inPaddle2Y, 'paddle');
        const paddle2 = this.physics.add.sprite(inPaddle3X, inPaddle2Y, 'paddleV');
        const paddle3 = this.physics.add.sprite(inPaddle4X, inPaddle2Y, 'paddleV');
        this.paddles = [paddle0, paddle1, paddle2, paddle3, paddle0];

        const ball = this.physics.add.sprite(inBallX, inBallY, 'ball');
        ball.setCollideWorldBounds(true);
        ball.setBounce(1);
        ball.setCircle(ballRadius, 0, 0);
        this.balls = [ball];

        this.physics.add.overlap(paddle0, ball, collideHPaddleBall);
        this.physics.add.overlap(paddle1, ball, collideHPaddleBall);
        this.physics.add.overlap(paddle2, ball, collideVPaddleBall);
        this.physics.add.overlap(paddle3, ball, collideVPaddleBall);
       
        ball.setVelocityX(inBallVX);
        ball.setVelocityY(inBallVY);
    }

    initGame()
    {
        switch (this.gameId) {
            case 0:
                this.initGame0();
                break;
            case 1:
                this.initGame1();
                break;
            case 2:
                this.initGame2();
                break;
            case 3:
                this.initGame3();
                break;
            default:
                console.log("Game not present") 
        }
    }

    createTextures()
    {
        this.textures.remove("wallH");
        this.textures.remove("wallV");
        this.textures.remove("paddle");
        this.textures.remove("paddleV");
        this.textures.remove("ball");

        const wallHTex = this.textures.addDynamicTexture('wallH', gameWidth, wallWidth);
        if (!wallHTex)
            throw new Error("texture creation error");
        wallHTex.fill(wallColor);

        const wallVTex = this.textures.addDynamicTexture('wallV', wallWidth, gameHeight - 2*wallWidth);
        if (!wallVTex)
            throw new Error("texture creation error");
        wallVTex.fill(wallColor);

        const paddleTex = this.textures.addDynamicTexture('paddle', paddleWidth, paddleHeight);
        if (!paddleTex)
            throw new Error("texture creation error");
        else
        {
            paddleTex.fill(paddleColor);
            //this.paddleTex = paddleTex;
        }

        const paddleTexV = this.textures.addDynamicTexture('paddleV', paddleHeight, paddleWidth);
        if (!paddleTexV)
            throw new Error("texture creation error");
        else
        {
            paddleTexV.fill(paddleColor);
            //this.paddleTex = paddleTex;
        }

        const ballTex = this.textures.addDynamicTexture('ball', ballRadius*2, ballRadius*2);
        if (!ballTex)
            throw new Error("texture creation error");
        //else
        //    this.ballTex = ballTex;

        const ballGraphics = this.make.graphics({}, false);
        ballGraphics.fillStyle(ballColor, 1); // alpha == 1
        ballGraphics.fillCircle(ballRadius, ballRadius, ballRadius);
        ballTex.draw(ballGraphics);
    }

    create ()
    {
        if (this.gameId == undefined)
            //this.gameId = nGames-1;
            this.gameId = 0;

        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(backgroundColor);

        this.createTextures();

        this.physics.world.setBounds(wallWidth, wallWidth, gameWidth - 2 * wallWidth, gameHeight - 2 * wallWidth);
        
        const walls = this.physics.add.staticGroup();
        let wall:Phaser.GameObjects.Image;
        wall = this.make.image({x:0, y:0, key:'wallH', origin: {x:0,y:0}});
        walls.add(wall);
        wall = this.make.image({x:0, y: (gameHeight - 1 * wallWidth), key:'wallH', origin: {x:0,y:0}});
        walls.add(wall);
        wall = this.make.image({x:0, y: wallWidth, key:'wallV', origin: {x:0,y:0}});
        walls.add(wall);
        wall = this.make.image({x:(gameWidth - wallWidth), y:wallWidth, key:'wallV', origin: {x:0,y:0}});
        walls.add(wall);

        this.cursors = this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;
        
        this.initGame();
        this.setupPaddles();
       
        EventBus.emit('current-scene-ready', this);
        this.events.once("shutdown", () => {
            this.reset();
          });
    }

    updateGame0()
    {
        if (this.cursors.left.isDown || this.cursors.down.isDown) {
            //this.paddle.setVelocityX(-400);
            this.paddles[0].setAccelerationX(-paddleAccel);
            //this.paddle2.setAccelerationX(-paddleAccel);
        }
        else if (this.cursors.right.isDown || this.cursors.up.isDown) {
            //this.paddle.setVelocityX(400);
            this.paddles[0].setAccelerationX(paddleAccel);
            //this.paddle2.setAccelerationX(paddleAccel);
        }
        else {
            //this.paddle.setVelocityX(0);
            this.paddles[0].setAccelerationX(0);
        }      
    }

    updateGame1()
    {
        this.updateGame0();
        this.paddles[1].body.x = gameWidth - this.paddles[0].body.x - paddleWidth;
    }

    updateGame2()
    {
        this.updateGame1();
    }
    updateGame3()
    {
        //this.updateGame1();
        this.updateGame0();
        console.log(this.paddles[0].body.x)
        this.paddles[1].body.x = gameWidth - this.paddles[0].body.x - paddleWidth;
        this.paddles[2].body.y = Math.floor(this.paddles[0].body.x *
                                            (gameHeight - paddleWidth - wallWidth) / (gameWidth - paddleWidth - wallWidth));
        this.paddles[3].body.y = gameHeight - this.paddles[2].body.y - paddleWidth;

        const v = this.paddles[0].body.velocity.x;
        this.paddles[1].setVelocityX(-v);
        this.paddles[2].setVelocityY(v);
        this.paddles[3].setVelocityY(-v);
    }

    update ()
    {
        //console.log(this.game.loop.actualFps)
        //this.cursors = this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;

        switch (this.gameId) {
            case 0:
                this.updateGame0();
                break;
            case 1:
                this.updateGame1();
                break;
            case 2:
                this.updateGame2();
                break;
            case 3:
                this.updateGame3();
                break;
            default:
                console.log("Game not present") 
        }
    }
    
    changeScene ()
    {
        this.gameId = (this.gameId + 1) % nGames;
        console.log(this.gameId);
        this.scene.restart();
    }
}
