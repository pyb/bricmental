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

const inPaddleX = 400;
const inPaddle1Y = 680;
const inPaddle2Y = 100;
const inBallX = 100;
const inBallY = 200;
const inBallVX = 510;
const inBallVY = 470;

const paddleAccel = 4000;
const paddleDrag = 0.0002;
const maxBallVx = 750;
const maxPaddleVx = 2000;
const paddleBounce = 0.34;

const nGames = 2;

const collidePaddleBall = (paddle:any, ball:any) => {
    if (Math.abs(ball.y - paddle.y) > (ballRadius + paddleHeight/2) - 1) {
        // top or bottom collision
        if (ball.y > paddle.y)
            ball.y = paddle.y + (ballRadius + paddleHeight/2) + 1;
        else
            ball.y = paddle.y - (ballRadius + paddleHeight/2) - 1;
        const vy = ball.body.velocity.y;
        ball.setVelocityY(-vy);
        if (ball.x > paddle.x + paddleWidth/2 + ballRadius)
            ball.setVelocityX(Math.abs(ball.body.velocity.x));
        else if (ball.x < paddle.x - ballRadius)
            ball.setVelocityX(-Math.abs(ball.body.velocity.x));
        else {
            // near the middle of the paddle. no velocity change
        }
    }
    else {
        //side collision
        const ballVx = ball.body.velocity.x;
        const paddleVx = paddle.body.velocity.x;
        if (Math.sign(ballVx) == Math.sign(paddleVx))
        {
            let vx = -(ballVx + paddleVx);
            vx = Math.min(vx, maxBallVx);
            vx = Math.max(vx, -maxBallVx);
            ball.setVelocityX(vx);
        }
        else
        {
            let vx = -ballVx;
            vx = Math.min(vx, maxBallVx);
            vx = Math.max(vx, -maxBallVx);
            ball.setVelocityX(vx);
        }
            
    } 
};

export class BrickGame extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    balls: Array<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>;
    paddles: Array<Phaser.Types.Physics.Arcade.SpriteWithDynamicBody>;
    ballTex: Phaser.Textures.DynamicTexture;
    paddleTex: Phaser.Textures.DynamicTexture;
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

    initGame0()
    {
        const paddle = this.physics.add.sprite(inPaddleX, inPaddle1Y, 'paddle');
        this.paddles = [paddle];

        const ball = this.physics.add.sprite(inBallX, inBallY, 'ball');
        ball.setCollideWorldBounds(true);
        ball.setBounce(1);
        ball.setCircle(ballRadius, 0, 0);
        this.balls = [ball];

        this.physics.add.overlap(paddle, ball, collidePaddleBall);

        ball.setVelocityX(inBallVX);
        ball.setVelocityY(inBallVY);

        this.setupPaddles();
    }

    initGame1()
    {
        const paddle1 = this.physics.add.sprite(inPaddleX, inPaddle1Y, 'paddle');
        const paddle2 = this.physics.add.sprite(inPaddleX, inPaddle2Y, 'paddle');
        this.paddles = [paddle1, paddle2];

        const ball = this.physics.add.sprite(inBallX, inBallY, 'ball');
        ball.setCollideWorldBounds(true);
        ball.setBounce(1);
        ball.setCircle(ballRadius, 0, 0);
        this.balls = [ball];

        this.physics.add.overlap(paddle1, ball, collidePaddleBall);
        this.physics.add.overlap(paddle2, ball, collidePaddleBall);

        ball.setVelocityX(inBallVX);
        ball.setVelocityY(inBallVY);

        this.setupPaddles();
    }

    initGame()
    {
        console.log("init")
        console.log(this.gameId)
        switch (this.gameId) {
            case 0:
                this.initGame0();
                break;
            case 1:
                this.initGame1();
                break;
            default:
                console.log("Game not present") 
        }
    }

    create ()
    {
        if (!this.gameId)
            this.gameId = 0;
        
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(backgroundColor);

        this.physics.world.setBounds(wallWidth, wallWidth, gameWidth - 2 * wallWidth, gameHeight - 2 * wallWidth);

        this.textures.remove("wallH");
        this.textures.remove("wallV");
        this.textures.remove("paddle");
        this.textures.remove("ball");

        const wallHTex = this.textures.addDynamicTexture('wallH', gameWidth, wallWidth);
        if (!wallHTex)
            throw new Error("texture creation error");
        wallHTex.fill(wallColor);

        const wallVTex = this.textures.addDynamicTexture('wallV', wallWidth, gameHeight - 2*wallWidth);
        if (!wallVTex)
            throw new Error("texture creation error");
        wallVTex.fill(wallColor);

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

        const paddleTex = this.textures.addDynamicTexture('paddle', paddleWidth, paddleHeight);
        if (!paddleTex)
            throw new Error("texture creation error");
        else
        {
            paddleTex.fill(paddleColor);
            this.paddleTex = paddleTex;
        }

        const ballTex = this.textures.addDynamicTexture('ball', ballRadius*2, ballRadius*2);
        if (!ballTex)
            throw new Error("texture creation error");
        else
            this.ballTex = ballTex;

        const ballGraphics = this.make.graphics({}, false);
        ballGraphics.fillStyle(ballColor, 1); // alpha == 1
        ballGraphics.fillCircle(ballRadius, ballRadius, ballRadius);
        ballTex.draw(ballGraphics);

        this.cursors = this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;
        
        this.initGame();
       
        EventBus.emit('current-scene-ready', this);
        this.events.once("shutdown", () => {
            this.reset();
          });
    }

    updateGame0()
    {
        if (this.cursors.left.isDown)
            {
                //this.paddle.setVelocityX(-400);
                this.paddles[0].setAccelerationX(-paddleAccel);
                //this.paddle2.setAccelerationX(-paddleAccel);
            }
            else if (this.cursors.right.isDown)
            {
                //this.paddle.setVelocityX(400);
                this.paddles[0].setAccelerationX(paddleAccel);
                //this.paddle2.setAccelerationX(paddleAccel);
            }
            else
            {
                //this.paddle.setVelocityX(0);
                this.paddles[0].setAccelerationX(0);
            }      
    }

    updateGame1()
    {
        this.updateGame0();
        this.paddles[1].body.x = gameWidth - this.paddles[0].body.x - paddleWidth;
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
            default:
                console.log("Game not present") 
        }
    }

    stop ()
    {
        console.log("stop")
    }
    
    changeScene ()
    {
        this.gameId = (this.gameId + 1) % nGames;
        this.scene.restart();
    }
}
