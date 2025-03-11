import { EventBus } from '../EventBus';
import { Scene, Textures } from 'phaser';

//const gameWidth = 1024;
//const gameHeight = 768;
const gameWidth = 650;
const gameHeight = 768;

const backgroundColor = 0x000000;
const wallColor = 0x888888;
const wallWidth = 30;

const inBallX = 100;
const inBallY = 200;
const inBallVX = 700;
const inBallVY = 530;
const ballRadius = 10;
const ballColor = 0x886644;
const ballGravity = 1400;
const maxBallV = 2000;
const ballDrag = 0.50;
const ballResetV = 8;

const inPaddleX = 400;
const inPaddleY = 710;
const paddleAccel = 4000;
const paddleDrag = 0.0002;
const maxBallVx = 750;
const maxPaddleVx = 2000;
const paddleBounce = 0.34;
const paddleBoost = 850;
const paddleWidth = 100;
const paddleHeight = 12;
const paddleColor = 0xdddddd;
const paddleVMin = 300;

const bumperRadius = 18;
const bumperColor = 0x884a94;
const bumper1X = 150;
const bumper2X = gameWidth/2;
const bumper3X = gameWidth - bumper1X;
const bumperY = 350;
const bumperBoost = 2.6;

const brickWidth = 28;
const brickHeight = 24;
const brickColor = 0xd0b4d1;
const firstBrickR1X = 105;
const firstBrickR2X = 113;
const brickYR1 = 95;
const brickYR2 = 123;
const brickSpacing = 4;
const nBricks = 14;

const holeWidth = 150;
const dropDelay = 1500; // in ms

const collideBumperBall = (ball:any, bumper:any) => {
    const vx = ball.body.velocity.x;
    const vy = ball.body.velocity.y;
    ball.setVelocityX(vx * bumperBoost);
    ball.setVelocityY(vy * bumperBoost);
}

enum Zone {
    LongLeft,
    ShortLeft,
    ShortRight,
    LongRight,
}

const collideBallBrick = (ball:any, brick:any) => {
    brick.destroy();
}

const collidePaddleBall = (paddle:any, ball:any) => {
    if (Math.abs(ball.y - paddle.y) > (ballRadius + paddleHeight/2) - 1) {
    // top or bottom collision
        const fraction = ((ball.body.x - paddle.body.x - paddleWidth/2) / paddleWidth);
        let paddleZone:number;
        if (fraction > .4)
            paddleZone = Zone.LongRight;
        else if (fraction < -.4)
            paddleZone = Zone.LongLeft;
        else if (fraction > 0)
            paddleZone = Zone.ShortRight;
        else
            paddleZone = Zone.ShortLeft;

        let vx = ball.body.velocity.x;
        let vy = ball.body.velocity.y;
       
        if (ball.y > paddle.y)
            ball.y = paddle.y + (ballRadius + paddleHeight/2) + 1;
        else
            ball.y = paddle.y - (ballRadius + paddleHeight/2) - 1;
        
        vy = -vy;
        let vIn = Math.sqrt(vx*vx + vy*vy);
        let vAngle = Math.atan2(-vy, vx); // -vy because y is negative up
        
        switch (paddleZone) {
            case Zone.LongRight:
                if (vAngle > 3.14/2)
                {
                    vAngle = (3.14 - vAngle);
                    vAngle /= 1.4;
                }
                vAngle /= 1.4;
                break;
            case Zone.LongLeft:
                if (vAngle < 3.14/2)
                {
                    vAngle /= 1.4;
                    vAngle = (3.14 - vAngle);
                }
                else
                {
                    vAngle += (3.14-vAngle)/4;
                }
                break;
            case Zone.ShortRight:
            case Zone.ShortLeft:
                break;
            default:
            
            vAngle = Math.max(vAngle, 0);
            vAngle = Math.min(vAngle, 3.14);
        }

        vIn += paddleBoost;
        if (vIn < paddleVMin)
            vIn = paddleVMin;

        vx = vIn * Math.cos(vAngle);
        vy = -vIn * Math.sin(vAngle);

        ball.setVelocityY(vy);
        ball.setVelocityX(vx);
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
    bumper1: Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
    bumper2: Phaser.Types.Physics.Arcade.SpriteWithStaticBody;
    bumper3: Phaser.Types.Physics.Arcade.SpriteWithStaticBody;

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

        const brickTex = this.textures.addDynamicTexture('brick', brickWidth, brickHeight);
        if (!brickTex)
            throw new Error("texture creation error");
        brickTex.fill(brickColor);

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
        
        const bumperTex = this.textures.addDynamicTexture('bumper', bumperRadius*2, bumperRadius*2);
        if (!bumperTex)
            throw new Error("texture creation error");
        const bumperGraphics = this.make.graphics({}, false);
        bumperGraphics.fillStyle(bumperColor, 1); // alpha == 1
        bumperGraphics.fillCircle(bumperRadius, bumperRadius, bumperRadius);
        bumperTex.draw(bumperGraphics);

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

        this.ball.body.setAllowDrag(true);
        this.ball.body.setDamping(true);
        this.ball.body.setDrag(ballDrag, ballDrag);
        if (ballGravity)
            this.ball.body.setGravityY(ballGravity);

        this.physics.add.overlap(this.paddle, this.ball, collidePaddleBall);
        this.physics.add.collider(this.ball, walls);

        this.paddle.setBounce(paddleBounce);
        this.paddle.setCollideWorldBounds(true);
        
        this.paddle.body.setMaxSpeed(maxPaddleVx);
        this.paddle.body.setAllowDrag(true);
        this.paddle.body.setDamping(true);
        this.paddle.body.setDrag(paddleDrag, 0);

        this.cursors = this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;

        const bumpers = this.physics.add.staticGroup();
        this.bumper1 = this.physics.add.staticSprite(bumper1X, bumperY, 'bumper');
        bumpers.add(this.bumper1);
        this.bumper2 = this.physics.add.staticSprite(bumper2X, bumperY, 'bumper');
        bumpers.add(this.bumper2);
        this.bumper3 = this.physics.add.staticSprite(bumper3X, bumperY, 'bumper');
        bumpers.add(this.bumper3);
        this.bumper1.setCircle(bumperRadius, 0, 0);
        this.bumper2.setCircle(bumperRadius, 0, 0);
        this.bumper3.setCircle(bumperRadius, 0, 0);
        this.physics.add.collider(this.ball, bumpers, collideBumperBall);

        const bricks = this.physics.add.staticGroup();
    

        for (let i = 0 ; i < nBricks ; i++)
        {
            let brick;
            brick = this.physics.add.staticSprite(firstBrickR1X + (brickWidth + brickSpacing) * i, brickYR1, 'brick');
            bricks.add(brick);
            brick = this.physics.add.staticSprite(firstBrickR2X + (brickWidth + brickSpacing) * i, brickYR2, 'brick');
            bricks.add(brick);
        }
        this.physics.add.collider(this.ball, bricks, collideBallBrick);

        this.initBall();

        EventBus.emit('current-scene-ready', this);
    }

    update ()
    {
        let vx = this.ball.body.velocity.x;
        let vy = this.ball.body.velocity.y;
        const v = Math.sqrt (vx*vx + vy*vy)

        if ( (v < ballResetV) &&
              (gameHeight - this.ball.y) < 70)  
        {
            // stuck?
            this.initBall();
            return;
        }
        if (v > maxBallV)
        {
            const vAngle = Math.atan2(vy, vx);
            vx = 0.7 * maxBallV * Math.cos(vAngle);
            vy = 0.7 * maxBallV * Math.sin(vAngle);
            this.ball.setVelocityX(vx);
            this.ball.setVelocityY(vy);
        }

        if (!this.dropTimer &&
            (   (this.ball.y > gameHeight+50) ||
                (this.ball.x > gameWidth+50) ||
                (this.ball.x < -20) ||
                (this.ball.y < -20) ) )
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
