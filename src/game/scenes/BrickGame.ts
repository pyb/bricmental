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
const ballRadius = 10;
const ballColor = 0x886644;

const inPaddleX = 400;
const inPaddleY = 400;
const inBallX = 100;
const inBallY = 200;
const inBallVX = 500;
const inBallVY = 300;

const collidePaddleBall = (paddle:any, ball:any) => {
    if (Math.abs(ball.y - paddle.y) > (ballRadius + paddleHeight/2) - 1) {
        // top or bottom collision
        const vy = ball.body.velocity.y;
        ball.setVelocityY(-vy);
        //ball.setVelocityX(0);
        //ball.setVelocityY(0);
    }
    else {
        //side collision
        const vx = ball.body.velocity.x;
        ball.setVelocityX(-vx);
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
        this.ball = this.physics.add.sprite(inBallX, inBallY, 'ball');
        this.ball.setCollideWorldBounds(true);
        this.ball.setBounce(1);
        this.ball.setCircle(ballRadius, 0, 0);

        this.physics.add.overlap(this.paddle, this.ball, collidePaddleBall);

        this.ball.setVelocityX(inBallVX);
        this.ball.setVelocityY(inBallVY);

        //paddle.setPushable(false);
        this.paddle.setBounce(0.1);
        this.paddle.setCollideWorldBounds(true);
        this.paddle.setDragX(.3);

        this.cursors = this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;

        EventBus.emit('current-scene-ready', this);
    }

    update ()
    {
        // tmp
        this.cursors = this.input.keyboard?.createCursorKeys() as Phaser.Types.Input.Keyboard.CursorKeys;

        if (this.cursors.left.isDown)
            {
                this.paddle.setVelocityX(-400);
            }
            else if (this.cursors.right.isDown)
            {
                this.paddle.setVelocityX(400);
            }
            else
            {
                this.paddle.setVelocityX(0);
            }
    }
    changeScene ()
    {
        this.scene.start('MainMenu');
    }
}
