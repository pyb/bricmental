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

const inBall1VX = 600;
const inBall1VY = 470;
const inBall1X = 100;
const inBall1Y = 200;

const inBall2VX = -700;
const inBall2VY = 360;
const inBall2X = 600;
const inBall2Y = 200;

const paddleAccel = 4000;
const paddleDrag = 0.0002;
const maxBallVx = 750;
const maxPaddleVx = 2000;
const paddleBounce = 0.34;
const inPaddleX = 400;
const inPaddleY = 630;

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

const prepBall = (ball:Phaser.Types.Physics.Arcade.SpriteWithDynamicBody, vx:number, vy:number) => {
    ball.setCollideWorldBounds(true);
    ball.setBounce(1);
    ball.setCircle(ballRadius, 0, 0);
    ball.setVelocityX(vx);
    ball.setVelocityY(vy);
}

export class BrickGame extends Scene
{
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;
    cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    ball1: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    ball2: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
    paddle: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;

    constructor ()
    {
        super('BrickGame');
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
        paddleTex.fill(paddleColor);
        

        const ballTex = this.textures.addDynamicTexture('ball', ballRadius*2, ballRadius*2);
        if (!ballTex)
            throw new Error("texture creation error");
        const ballGraphics = this.make.graphics({}, false);
        ballGraphics.fillStyle(ballColor, 1); // alpha == 1
        ballGraphics.fillCircle(ballRadius, ballRadius, ballRadius);
        ballTex.draw(ballGraphics);

        this.paddle = this.physics.add.sprite(inPaddleX, inPaddleY, 'paddle');

        this.ball1 = this.physics.add.sprite(inBall1X, inBall1Y, 'ball');
        prepBall(this.ball1, inBall1VX, inBall1VY);
        this.physics.add.overlap(this.paddle, this.ball1, collidePaddleBall);

        this.ball2 = this.physics.add.sprite(inBall2X, inBall2Y, 'ball');
        prepBall(this.ball2, inBall2VX, inBall2VY);
        this.physics.add.overlap(this.paddle, this.ball2, collidePaddleBall);

        this.physics.add.collider(this.ball1, this.ball2);

        //paddle.setPushable(false);
        this.paddle.setBounce(paddleBounce);
        this.paddle.setCollideWorldBounds(true);
        
        this.paddle.body.setMaxSpeed(maxPaddleVx);
        this.paddle.body.setAllowDrag(true);
        this.paddle.body.setDamping(true);
        this.paddle.body.setDrag(paddleDrag, 0);

        this.cursors = this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;

        EventBus.emit('current-scene-ready', this);
    }

    update ()
    {
        //console.log(this.game.loop.actualFps)
        // tmp
        this.cursors = this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;

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
