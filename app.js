const stageWidth = 512;
const stageHeight = 512;

const app = new PIXI.Application({
    width: stageWidth, // default: 800
    height: stageHeight, // default: 600
    antialias: true, // default: false
    transparent: false, // default: false
    resolution: 1 // default: 1
});
app.renderer.backgroundColor = 0x333333;

document.body.appendChild(app.view);

const Application = PIXI.Application,
    Container = PIXI.Container,
    loader = PIXI.Loader.shared,
    resources = PIXI.Loader.shared.resources,
    TextureCache = PIXI.utils.TextureCache,
    Sprite = PIXI.Sprite,
    Rectangle = PIXI.Rectangle,
    Circle = PIXI.Circle,
    Graphics = PIXI.Graphics,
    TextStyle = PIXI.TextStyle,
    Text = PIXI.Text,
    Button = PIXI.Button,
    Texture = PIXI.Texture;


loader.add("images/treasureHunter.json")
    .add("button", "images/button.jpg")
    .load(setup)

let dungeon, explorer, treasure, door, id, state, blobs = [],
    message, explorerHit = false,
    level = 1,
    btn_again, btn_nextLevel, speed = 2,
    levelText;
const gameScene = new Container(),
    gameOverScene = new Container(),
    nextLevelScene = new Container(),
    healthBar = new Container(),
    innerBar = new Graphics(),
    outerBar = new Graphics();


function setup() {
    app.stage.addChild(gameOverScene)
    app.stage.addChild(gameScene)
        // add dungeon stage
    dungeon = new Sprite(resources["images/treasureHunter.json"].textures["dungeon.png"])
    gameScene.addChild(dungeon)

    // add explorer to stage
    explorer = new Sprite(resources["images/treasureHunter.json"].textures["explorer.png"])
    explorer.x = 68;
    explorer.y = stageHeight / 2 - explorer.height / 2;
    explorer.vx = 0;
    explorer.vy = 0;
    gameScene.addChild(explorer)

    // add treasure to stage
    treasure = new Sprite(resources["images/treasureHunter.json"].textures["treasure.png"])
    treasure.x = stageWidth - treasure.width - 48;
    treasure.y = stageHeight / 2 - treasure.height / 2;
    gameScene.addChild(treasure)

    //exit door
    door = new Sprite(resources["images/treasureHunter.json"].textures["door.png"])
    door.position.set(32, 0);
    gameScene.addChild(door)

    let numberBlobs = 6,
        spacing = 48,
        xOffset = 150,
        direction = 1;

    for (let i = 0; i < numberBlobs; i++) {
        var blob = new Sprite(resources["images/treasureHunter.json"].textures["blob.png"])
        blob.x = spacing * i + xOffset;
        blob.y = randomInt(0, stageHeight - blob.height);
        blob.vy = speed * direction;
        direction *= -1;
        blobs.push(blob);
        gameScene.addChild(blob);
    }

    //Create the health bar
    healthBar.position.set(stageWidth - 170, 4);
    gameScene.addChild(healthBar);

    //Create the black background rectangle
    innerBar.beginFill(0x000000);
    innerBar.drawRect(0, 0, 128, 8);
    innerBar.endFill();
    healthBar.addChild(innerBar);

    outerBar.beginFill(0xFF3300);
    outerBar.drawRect(0, 0, 128, 8);
    outerBar.endFill();
    healthBar.addChild(outerBar);

    healthBar.outer = outerBar;
    healthBar.outer.width = 128;

    const style = new TextStyle({
        fontFamily: "Futura",
        fontSize: 64,
        fill: "white"
    });
    message = new Text("The End!", style);
    message.x = 120;
    message.y = stageHeight / 2 - 32;
    gameOverScene.addChild(message);
    gameOverScene.visible = false;

    const styleLevel = new TextStyle({
        fontFamily: "Futura",
        fontSize: 20,
        fill: "white"
    });

    levelText = new Text("Level " + level, styleLevel);
    levelText.x = 150;
    levelText.y = 10;
    gameScene.addChild(levelText)


    const textureAgain = resources.button.texture;
    const rectangleAgain = new Rectangle(200, 3050, 900, 900);
    textureAgain.frame = rectangleAgain;
    btn_again = new Sprite(textureAgain);
    btn_again.scale.set(0.1, 0.1);
    btn_again.position.set(100, 200);
    btn_again.interactive = true;
    btn_again.buttonMode = true;
    btn_again.on('pointerdown', onAgain);
    nextLevelScene.addChild(btn_again)

    const textureNextLv = new Texture(resources.button.texture);
    const rectangleNextLv = new Rectangle(2100, 200, 900, 900);
    textureNextLv.frame = rectangleNextLv;
    btn_nextLevel = new Sprite(textureNextLv);
    btn_nextLevel.scale.set(0.1, 0.1);
    btn_nextLevel.position.set(300, 200);
    btn_nextLevel.interactive = true;
    btn_nextLevel.buttonMode = true;
    btn_nextLevel.on('pointerdown', onNextLv);
    nextLevelScene.addChild(btn_nextLevel)
    nextLevelScene.visible = false;
    app.stage.addChild(nextLevelScene)

    // define keyboard
    const left = keyboard("ArrowLeft"),
        up = keyboard("ArrowUp"),
        right = keyboard("ArrowRight"),
        down = keyboard("ArrowDown");

    //Left 
    left.press = () => {
        explorer.vx = -5;
        if (down.isDown) {
            explorer.vy = 5;
        } else if (up.isDown) {
            explorer.vy = -5;
        }
    };

    left.release = () => {
        if (!right.isDown) {
            explorer.vx = 0;
        }
        if (down.isUp && up.isUp) {
            explorer.vy = 0;
        }
    };

    //Right
    right.press = () => {
        explorer.vx = 5;
        if (down.isDown) {
            explorer.vy = 5;
        } else if (up.isDown) {
            explorer.vy = -5;
        }
    };
    right.release = () => {
        if (!left.isDown) {
            explorer.vx = 0;
        }
        if (down.isUp && up.isUp) {
            explorer.vy = 0;
        }
    };

    //Up
    up.press = () => {
        explorer.vy = -5;
        if (left.isDown) {
            explorer.vx = -5;
        } else if (right.isDown) {
            explorer.vx = 5;
        }
    };
    up.release = () => {
        if (!down.isDown) {
            explorer.vy = 0;
        }
        if (left.isUp && right.isUp) {
            explorer.vx = 0;
        }
    };

    //Down
    down.press = () => {
        explorer.vy = 5;
        if (left.isDown) {
            explorer.vx = -5;
        } else if (right.isDown) {
            explorer.vx = 5;
        }
    };
    down.release = () => {
        if (!up.isDown) {
            explorer.vy = 0;
        }
        if (left.isUp && right.isUp) {
            explorer.vx = 0;
        }
    };

    state = play;

    app.ticker.add((delta) => gameLoop(delta))
}

function onAgain() {
    nextLevelScene.visible = false;
    gameScene.visible = true;
    again();
    state = play;
}

function onNextLv() {
    nextLevelScene.visible = false;
    gameScene.visible = true;
    level = level + 1;
    again();
    state = play;
}

function gameLoop(delta) {
    state(delta);
}

function play(delta) {

    contain(explorer, { x: 28, y: 10, width: 488, height: 480 })
    let increSpeed = 2,
        decreBlood = 2;
    explorer.x += explorer.vx;
    explorer.y += explorer.vy;
    if (level == 2) {
        increSpeed = 4;
        decreBlood = 4;

    } else if (level == 3) {
        increSpeed = 8;
        decreBlood = 6;
    }
    levelText.text = "Level " + level;

    for (let i = 0; i < blobs.length; i++) {
        if (blobs[i].vy > 0) {
            blobs[i].vy = increSpeed;
        } else {
            blobs[i].vy = -increSpeed;
        }
        blobs[i].y += blobs[i].vy;

        const blobHitsWall = contain(blobs[i], { x: 28, y: 10, width: 488, height: 480 });

        if (blobHitsWall === "top" || blobHitsWall === "bottom") {
            blobs[i].vy *= -1;
        }
        if (hitTestRectangle(explorer, blobs[i])) {
            explorer.alpha = 0.5;
            healthBar.outer.width -= decreBlood;
        } else {
            explorer.alpha = 1
        }
    }
    if (hitTestRectangle(explorer, treasure)) {
        treasure.x = explorer.x + 8;
        treasure.y = explorer.y + 8;
    }
    if (healthBar.outer.width < 0) {
        state = end;
        message.text = "You lost!";
    }

    if (hitTestRectangle(treasure, door)) {
        if (level === 3) {
            state = end;
            message.text = "You won!";
        } else {
            gameScene.visible = false;
            nextLevelScene.visible = true;

        }
    }

}


function end() {
    gameOverScene.visible = true;
    gameScene.visible = false;
}

function again() {
    gameOverScene.visible = false;
    explorer.x = 68;
    explorer.y = stageHeight / 2 - explorer.height / 2;
    healthBar.outer.width = 128
    treasure.x = gameScene.width - treasure.width - 48;
    treasure.y = gameScene.height / 2 - treasure.height / 2;

}

function hitTestRectangle(r1, r2) {

    //Define the variables we'll need to calculate
    let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

    //hit will determine whether there's a collision
    hit = false;

    //Find the center points of each sprite
    r1.centerX = r1.x + r1.width / 2;
    r1.centerY = r1.y + r1.height / 2;
    r2.centerX = r2.x + r2.width / 2;
    r2.centerY = r2.y + r2.height / 2;

    //Find the half-widths and half-heights of each sprite
    r1.halfWidth = r1.width / 2;
    r1.halfHeight = r1.height / 2;
    r2.halfWidth = r2.width / 2;
    r2.halfHeight = r2.height / 2;

    //Calculate the distance vector between the sprites
    vx = r1.centerX - r2.centerX;
    vy = r1.centerY - r2.centerY;

    //Figure out the combined half-widths and half-heights
    combinedHalfWidths = r1.halfWidth + r2.halfWidth;
    combinedHalfHeights = r1.halfHeight + r2.halfHeight;

    //Check for a collision on the x axis
    if (Math.abs(vx) < combinedHalfWidths) {

        //A collision might be occurring. Check for a collision on the y axis
        if (Math.abs(vy) < combinedHalfHeights) {

            //There's definitely a collision happening
            hit = true;
        } else {

            //There's no collision on the y axis
            hit = false;
        }
    } else {

        //There's no collision on the x axis
        hit = false;
    }

    //`hit` will be either `true` or `false`
    return hit;
};

function contain(sprite, container) {

    let collision = undefined;

    //Left
    if (sprite.x < container.x) {
        sprite.x = container.x;
        collision = "left";
    }

    //Top
    if (sprite.y < container.y) {
        sprite.y = container.y;
        collision = "top";
    }

    //Right
    if (sprite.x + sprite.width > container.width) {
        sprite.x = container.width - sprite.width;
        collision = "right";
    }

    //Bottom
    if (sprite.y + sprite.height > container.height) {
        sprite.y = container.height - sprite.height;
        collision = "bottom";
    }

    //Return the `collision` value
    return collision;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function radomBoolean() {
    return Math.round((Math.random() * 1) + 0) === 0;
}

// keyboard function
function keyboard(value) {
    const key = {};
    key.value = value;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = (event) => {
        if (event.key === key.value) {
            if (key.isUp && key.press) {
                key.press();
            }
            key.isDown = true;
            key.isUp = false;
            event.preventDefault();
        }
    };

    //The `upHandler`
    key.upHandler = (event) => {
        if (event.key === key.value) {
            if (key.isDown && key.release) {
                key.release();
            }
            key.isDown = false;
            key.isUp = true;
            event.preventDefault();
        }
    };

    //Attach event listeners
    const downListener = key.downHandler.bind(key);
    const upListener = key.upHandler.bind(key);

    window.addEventListener("keydown", downListener, false);
    window.addEventListener("keyup", upListener, false);

    // Detach event listeners
    key.unsubscribe = () => {
        window.removeEventListener("keydown", downListener);
        window.removeEventListener("keyup", upListener);
    };

    return key;
}