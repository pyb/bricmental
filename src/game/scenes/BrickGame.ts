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
const ballGravity = 70;

const inPaddleX = 400;
const inPaddleY = 630;
const inBallX = 100;
const inBallY = 200;
const inBallVX = 700;
const inBallVY = 530;

const paddleAccel = 4000;
const paddleDrag = 0.0002;
const maxBallVx = 750;
const maxPaddleVx = 2000;
const paddleBounce = 0.34;
const ballDrag = 0.96;
const paddleBoost = 300;
const paddleRandomAngleFactor = 8;

const vMin = 600;
const holeWidth = 200;
const dropDelay = 1500; // in ms

const collidePaddleBall = (paddle:any, ball:any) => {
    if (Math.abs(ball.y - paddle.y) > (ballRadius + paddleHeight/2) - 1) {
        let vx = ball.body.velocity.x;
        let vy = ball.body.velocity.y;

        // top or bottom collision
        if (ball.y > paddle.y)
            ball.y = paddle.y + (ballRadius + paddleHeight/2) + 1;
        else
            ball.y = paddle.y - (ballRadius + paddleHeight/2) - 1;
        
        
        vy = -vy;
        const vIn = Math.sqrt(vx*vx + vy*vy);
        let vAngle = Math.atan2(vy, vx);
        vAngle += Math.random()/paddleRandomAngleFactor;
        if (vIn < vMin)
        {
            // minimum viable boost
            vx = vMin * Math.cos(vAngle);
            vy = vMin * Math.sin(vAngle);
        }
        else
        {
            vx += paddleBoost * Math.cos(vAngle);
            vy += paddleBoost * Math.sin(vAngle);
        }

        ball.setVelocityY(vy);

        if (ball.x > paddle.x + ballRadius)
        {
            ball.setVelocityX(Math.abs(vx));
        }
        else if (ball.x < paddle.x - ballRadius)
        {
            ball.setVelocityX(-Math.abs(vx));
        }
        else {
            // near the middle of the paddle. no velocity change
            ball.setVelocityX(vx);
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
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    ball: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    paddle: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    dropTimer:Phaser.Time.TimerEvent | null;

    constructor ()
    {
        super('BrickGame');
    }

    initBall ()
    {
        this.dropTimer = null;
        this.ball.setVelocityX(inBallVX);
        this.ball.setVelocityY(inBallVY);
        this.ball.setX(inBallX);
        this.ball.setY(inBallY);
    }

    create ()
    {
        this.camera = this.cameras.main;
        this.camera.setBackgroundColor(backgroundColor);

        this.physics.world.setBounds(wallWidth, wallWidth, gameWidth - 2 * wallWidth, gameHeight - 2 * wallWidth);

        const wallHTex = this.textures.addDynamicTexture('wallH', gameWidth, wallWidth);
        if (!wallHTex)
            throw new Error("texture creation error");
        wallHTex.fill(wallColor);

        const wallH2Tex = this.textures.addDynamicTexture('wallH2', (gameWidth - holeWidth) / 2, wallWidth);
        if (!wallH2Tex)
            throw new Error("texture creation error");
        wallH2Tex.fill(wallColor);

        const wallVTex = this.textures.addDynamicTexture('wallV', wallWidth, gameHeight - 2*wallWidth);
        if (!wallVTex)
            throw new Error("texture creation error");
        wallVTex.fill(wallColor);

        const walls = this.physics.add.staticGroup();
        let wall:Phaser.GameObjects.Image;
        wall = this.make.image({x:0, y:0, key:'wallH', origin: {x:0,y:0}});
        walls.add(wall);
        //wall = this.make.image({x:0, y: (gameHeight - 1 * wallWidth), key:'wallH', origin: {x:0,y:0}});
        //walls.add(wall);
        wall = this.make.image({x:0, y: (gameHeight - 1 * wallWidth), key:'wallH2', origin: {x:0,y:0}});
        walls.add(wall);

        wall = this.make.image({x:(gameWidth + holeWidth) / 2, y: (gameHeight - 1 * wallWidth), key:'wallH2', origin: {x:0,y:0}});
        walls.add(wall);

        wall = this.make.image({x:0, y: wallWidth, key:'wallV', origin: {x:0,y:0}});
        walls.add(wall);
        wall = this.make.image({x:(gameWidth - wallWidth), y:wallWidth, key:'wallV', origin: {x:0,y:0}});
        walls.add(wall);

        const paddleTex = this.textures.addDynamicTexture('paddle', paddleWidth, paddleHeight);
        if (!paddleTex)
            throw new Error("texture creation error");
        paddleTex.fill(paddleColor);
        

        const ballTex = this.textures.addDynamicTexture('ball', ballRadius*2, ballRadius*2);
        if (!ballTex)
            throw new Error("texture creation error");
        const ballGraphics = this.make.graphics({}, false);
        ballGraphics.fillStyle(ballColor, 1); // alpha == 1
        ballGraphics.fillCircle(ballRadius, ballRadius, ballRadius);
        ballTex.draw(ballGraphics);

        this.paddle = this.physics.add.sprite(inPaddleX, inPaddleY, 'paddle');
        this.ball = this.physics.add.sprite(inBallX, inBallY, 'ball');
        //this.ball.setCollideWorldBounds(true);
        this.ball.setBounce(1);
        this.ball.setCircle(ballRadius, 0, 0);

        this.physics.add.overlap(this.paddle, this.ball, collidePaddleBall);

        this.ball.body.setAllowDrag(true);
        this.ball.body.setDamping(true);
        this.ball.body.setDrag(ballDrag, ballDrag);
        if (ballGravity)
            this.ball.body.setGravityY(ballGravity);

        this.physics.add.collider(this.ball, walls);

        this.paddle.setBounce(paddleBounce);
        this.paddle.setCollideWorldBounds(true);
        
        this.paddle.body.setMaxSpeed(maxPaddleVx);
        this.paddle.body.setAllowDrag(true);
        this.paddle.body.setDamping(true);
        this.paddle.body.setDrag(paddleDrag, 0);

        this.cursors = this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;

        this.initBall();

        EventBus.emit('current-scene-ready', this);
    }

    update ()
    {
        //console.log(this.game.loop.actualFps)
        
        if (!this.dropTimer &&
            (this.ball.y > gameHeight))
        {
            this.dropTimer = this.time.addEvent({
                delay: dropDelay, // ms
                callback: () => this.initBall(),
                loop: false,
              });
        }
           

        if (this.cursors.left.isDown)
            {
                //this.paddle.setVelocityX(-400);
                this.paddle.setAccelerationX(-paddleAccel);
            }
            else if (this.cursors.right.isDown)
            {
                //this.paddle.setVelocityX(400);
                this.paddle.setAccelerationX(paddleAccel);
            }
            else
            {
                //this.paddle.setVelocityX(0);
                this.paddle.setAccelerationX(0);
            }
    }
    changeScene ()
    {
        this.scene.start('MainMenu');
    }
}
