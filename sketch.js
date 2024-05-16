// Constants that never change
const FONT_SIZE = 50; // Base reference font size (determines size of conveyors as well)
const USERNAME = "guest"; // User for adding scores to DB
let SUSHI_FACTOR = 2/3; // 0 = Infinite Sushi, 1 = No Sushi
// Initialise target number (10 -> 200 and -10 -> -200)
let x = Math.floor(Math.random() * 191) + 10;
if (Math.floor(Math.random() * 2) == 0) x *= -1
const TARGET = x;
// Constants that are modified using the list methods
const gameRats = [];
const gameOpes = [];
const gameCons = [];
const gameComs = [];
const gameInts = [];
const gameTras = [];
const gameAles = [];
const dragNDrop = [null];
const operatns = [];
// Classes for everything
class GameObject {
    constructor(x, y, parent) {
        this.x = x;
        this.y = y;
        this.parent = parent;
    }
    setPos(x, y) {
        this.x = x;
        this.y = y;
    }
    delete() {
        this.parent.splice(this.parent.indexOf(this), 1);
    }
}
class GameRational extends GameObject {
    constructor(x, y, n, d, parent) {
        // Construct a rational number and simplify it.
        super(x, y, parent);
        this.n = n;
        this.d = d;
        this.conveyor = false;
        this.combiner = false;
        let cols = shuffle([100, 125, 150, 175, 200, 225, 250]);
        this.col = color(cols[0], cols[1], cols[2]);
        this.simplify();
    }
    add (r) {
        // Add another rational.
        return new GameRational(this.x, this.y, this.n * r.d + r.n * this.d, this.d * r.d, this.parent);
    }
    sub (r) {
        // Subtract another rational.
        return new GameRational(this.x, this.y, this.n * r.d - r.n * this.d, this.d * r.d, this.parent);
    }
    mul (r) {
        // Multiply by another rational.
        return new GameRational(this.x, this.y, this.n * r.n, this.d * r.d, this.parent);
    }
    div (r) {
        // Divide by another rational.
        if (r.n == 0) {
            alert("Cannot divide by 0!");
            return this;
        }
        return new GameRational(this.x, this.y, this.n * r.d, this.d * r.n, this.parent);
    }
    getVal() {
        return this.n / this.d;
    }
    onConveyor() {
        this.conveyor = true;
    }
    offConveyor() {
        this.conveyor = false;
    }
    inCombiner() {
        this.combiner = true;
    }
    outCombiner() {
        this.combiner = false;
    }
    simplify() {
        // Simplify rational using Euclidean algorithm
        let num = this.n;
        let den = this.d;
        let rem = num % den;
        while (rem != 0) {
            num = den;
            den = rem;
            rem = num % den;
        }
        let gcd = den;
        this.n = Number.parseInt(this.n / gcd);
        this.d = Number.parseInt(this.d / gcd);
        if (this.d < 0) {
            this.n *= -1;
            this.d *= -1;
        }
    }
    // Update method called in Standard Game Loop (not on Conveyors)
    update() {
        if (this.conveyor) return;
        fill(this.col);
        stroke(0);
        strokeWeight(5);
        textSize(FONT_SIZE);
        textAlign(CENTER, CENTER);
        textStyle(NORMAL);
        if (this.d != 1) {
            text(`${this.n}/${this.d}`, this.x, this.y);
        } else {
            text(this.n, this.x, this.y);
        }
    }
    // Update method called by "GameConveyor"s
    updateCon() {
        if (!this.conveyor) return;
        fill(this.col);
        stroke(0);
        strokeWeight(5);
        textSize(FONT_SIZE);
        textAlign(CENTER, CENTER);
        textStyle(NORMAL);
        if (this.d != 1) {
            text(`${this.n}/${this.d}`, this.x, this.y);
        } else {
            text(this.n, this.x, this.y);
        }
    }
}
class GameOperator extends GameObject {
    constructor(x, y, op, parent) {
        super(x, y, parent);
        this.sym = op;
        this.conveyor = false;
        this.combiner = false;
        let cols = shuffle([100, 125, 150, 175, 200, 225, 250]);
        this.col = color(cols[0], cols[1], cols[2]);
        switch (this.sym) {
            case "+":
                this.op = (a, b) => a.add(b);
                break;
            case "-":
                this.op = (a, b) => a.sub(b);
                break;
            case "⨯":
                this.op = (a, b) => a.mul(b);
                break;
            case "÷":
                this.op = (a, b) => a.div(b);
                break;
            default:
                this.op = (a, b) => a.add(b);
                break;
        }
    }
    onConveyor() {
        this.conveyor = true;
    }
    offConveyor() {
        this.conveyor = false;
    }
    inCombiner() {
        this.combiner = true;
    }
    outCombiner() {
        this.combiner = false;
    }
    // Update method called in Standard Game Loop (not on Conveyors)
    update() {
        if (this.conveyor) return;
        fill(this.col);
        stroke(0);
        strokeWeight(5);
        textSize(FONT_SIZE);
        textAlign(CENTER, CENTER);
        textStyle(NORMAL);
        text(this.sym, this.x, this.y);
    }
    // Update method called by "GameConveyor"s
    updateCon() {
        if (!this.conveyor) return;
        fill(this.col);
        stroke(0);
        strokeWeight(5);
        textSize(FONT_SIZE);
        textAlign(CENTER, CENTER);
        textStyle(NORMAL);
        text(this.sym, this.x, this.y);
    }
}
class GameCombiner extends GameObject {
    constructor(x, y, ex, ey, parent) {
        super(x, y, parent);
        this.ex = ex;
        this.ey = ey;
        this.rats = [];
        this.op = null;
    }
    addObject(obj) {
        // Tell object that it is in the combiner (used for mouse presses)
        obj.inCombiner();
        // If the object is a Rational
        if (obj instanceof GameRational) {
            // If there are already 2 rationals
            if (this.rats.length == 2) {
                // Delete the oldest one and remove it from the rats list
                this.rats[0].delete();
                this.removeObject(this.rats[0]);
            }
            // Add the new one to the end of rats list
            this.rats.push(obj);
        }
        // If the object is an Operator
        if (obj instanceof GameOperator) {
            // If there is already an operator delete it
            if (this.op != null) this.op.delete();
            // Assign it to be the operator
            this.op = obj;
        }
    }
    removeObject(obj) {
        // Tell object that it is no longer in the combiner
        obj.outCombiner();
        // If the object is a Rational
        if (obj instanceof GameRational) {
            // If the object is in the first position, remove the first element, else remove the second element
            if (this.rats[0] == obj) this.rats.splice(0, 1); else this.rats.splice(1, 1);
        } else {
            this.op = null;
        }
    }
    // Update is called every frame
    update() {
        // Make Rectangle and Text
        fill(100, 100, 100, 200);
        rectMode(CORNERS);
        rect(width * this.x, height * this.y, width * this.ex, height * this.ey);
        noStroke();
        fill(200);
        textSize(FONT_SIZE/2);
        textAlign(CENTER, CENTER);
        textStyle(NORMAL);
        text("NUMBER OPERATION ROOM", width * (this.x + this.ex)/2, height * this.y + FONT_SIZE/2);
        // Move rationals and operators into correct positions (OCD)
        if (this.rats.length > 0) this.rats[0].setPos(width * (3 * this.x + this.ex)/4, height * (this.y + this.ey)/2);
        if (this.rats.length > 1) this.rats[1].setPos(width * (this.x + 3 * this.ex)/4, height * (this.y + this.ey)/2);
        if (this.op != null) this.op.setPos(width * (this.x + this.ex)/2, height * (this.y + this.ey)/2);
        // If both rationals and operator are present
        if (this.rats.length == 2 && this.op != null) {
            // Calculate the result
            let r = this.op.op(this.rats[0], this.rats[1]);
            // Add result to the parent list (rendering list)
            this.rats[0].parent.push(r);
            // Add operation to operatns array
            operatns.push(this.op.sym);
            // Delete the input rationals and operator
            this.clearInput();
            // Automatically add the result to be used in the next equation
            this.rats = [r];
            // Tell the result that it is in the combiner (so that mouse presses don't get buggy)
            r.inCombiner();
        }
    }
    clearInput() {
        // Delete each input rational and operator object and clear their respective variables
        this.rats.forEach(r => r.delete());
        this.rats = [];
        this.op.delete();
        this.op = null;
    }
    delete() {
        // Clear the input and delete the combiner
        this.clearInput();
        super.delete();
    }
}
class GameConveyor extends GameObject {
    constructor(parent, color, vertx) {
        super(0, 0, parent);
        this.chlds = [];
        this.col = color;
        this.vertx = vertx;
        this.offset = 0;
    }
    addObject(obj) {
        this.chlds.push([obj, 0]);
    }
    removeObject(obj) {
        this.chlds = this.chlds.filter(c => c[0] != obj);
    }
    update() {
        let totalLen = 0;
        // Calculate total length of conveyor
        this.vertx.reduce((p, c) => {
            let px = width * p[0];
            let py = height * p[1];
            let cx = width * c[0];
            let cy = height * c[1];
            let dx = px - cx;
            let dy = py - cy;
            let len = sqrt(dx**2 + dy**2);
            totalLen += len;
            return c;
        });
        // Calculate the number of circles to render (each circle has diameter of 50)
        let subCons = ceil(totalLen / (FONT_SIZE * SUSHI_FACTOR));
        // Update the offset by 1 (gives illusion of movement)
        this.offset += 0.05;
        this.offset %= 1;
        // Update Child Positions
        this.chlds.forEach(c => {
            c[0].onConveyor();
            // Add 5% to each child's position (divided by subCons to keep at same speed as conveyors)
            c[1] += 0.05 / subCons;
            if (c[1] >= 1) {
                c[0].delete();
            }
        });
        this.chlds = this.chlds.filter(c => c[1] < 1);
        // Calculate the percentages along the conveyor for each vertex
        let percs = [0];
        this.vertx.reduce((p,c) => {
            // Get previous and current x and y values, calculate difference and find length between them
            let px = width * p[0];
            let py = height * p[1];
            let cx = width * c[0];
            let cy = height * c[1];
            let dx = cx - px;
            let dy = cy - py;
            let len = sqrt(dx**2 + dy**2);
            percs.push(percs[percs.length-1] + len / totalLen);
            return c;
        });
        // Render Each Circle
        for (let i = 0; i < subCons; i++) {
            // Calculate the percentage along the conveyor (+ offset)
            let pc = i / subCons + this.offset / subCons;
            // Instantiate the closest index to be 0
            let closest = 0;
            // Finds the closest index that happens before it
            for (let p = 0; p < percs.length; p++) {
                if (percs[p] < pc) {
                    closest = p;
                }
            }
            // Calculate the x and y coordinate of the vertices behind and ahead of point
            let bx = width * this.vertx[closest][0];
            let by = height * this.vertx[closest][1];
            let ax = width * this.vertx[closest+1][0];
            let ay = height * this.vertx[closest+1][1];
            // Calculate difference and hence angle
            let dx = ax - bx;
            let dy = ay - by;
            let ang = atan2(dy, dx);
            // Draw circle at correct percentage along path
            stroke(0);
            strokeWeight(5);
            fill(this.col);
            ellipse(
                bx + totalLen * (pc - percs[closest]) * cos(ang),
                by + totalLen * (pc - percs[closest]) * sin(ang),
                FONT_SIZE
            );
        }
        // Loop over each child and set its position
        this.chlds.forEach(c => {
            // c = [obj, percent as decimal]
            // Instantiate the closest index to 0
            let closest = 0;
            // Finds the closest index that happens before it
            for (let p = 0; p < percs.length; p++) {
                if (percs[p] < c[1]) {
                    closest = p;
                }
            }
            // Calculate the x and y coordinate of the vertices behind and ahead of point
            let bx = width * this.vertx[closest][0];
            let by = height * this.vertx[closest][1];
            let ax = width * this.vertx[closest+1][0];
            let ay = height * this.vertx[closest+1][1];
            // Calculate differences and angle
            let dx = ax - bx;
            let dy = ay - by;
            let ang = atan2(dy, dx);
            c[0].setPos(
                bx + (c[1] - percs[closest]) * totalLen * cos(ang),
                by + (c[1] - percs[closest]) * totalLen * sin(ang)
            );
            c[0].updateCon();
        });
    }
}
class GameInteract extends GameObject {
    constructor(x, y, ex, ey, parent, text, col1, col2, targetCol) {
        super(x, y, parent);
        this.ex = ex;
        this.ey = ey;
        this.text = text;
        this.col1 = col1;
        this.col2 = col2;
        this.tcol = targetCol;
        this.hover = false;
        this.thover = false;
    }
    update() {
        // Get mouse position in relation to center
        let mx = mouseX - width/2;
        let my = mouseY - height/2;
        // Get edge of button coordinates
        let lx = width * this.x;
        let rx = width * this.ex;
        let ty = height * this.y;
        let by = height * this.ey;
        // Check if mouse is over button
        this.hover = mx > lx && mx < rx && my > ty && my < by;
        // Check if target is hovering over button
        if (this.hover && dragNDrop[0] != null && dragNDrop[0] instanceof GameRational) {;
            this.thover = (dragNDrop[0].getVal() == TARGET);
        } else {
            this.thover = false;
        }
        // Draw Button
        stroke(0);
        strokeWeight(5);
        if (this.thover) fill(this.tcol); else if (this.hover) fill(this.col2); else fill(this.col1);
        rectMode(CORNERS);
        rect(lx, ty, rx, by);
        fill(255);
        textSize(FONT_SIZE);
        textAlign(CENTER, CENTER);
        textStyle(BOLD);
        text(this.text, (lx + rx)/2, (ty + by)/2);
    }
}
class GameTrashCan extends GameObject {
    constructor(x, y, parent) {
        super(x, y, parent);
        this.hover = false;
    }
    update() {
        let mx = mouseX - width/2;
        let my = mouseY - height/2;
        this.hover = mx > width * this.x - 35 && mx < width * this.x + 35 && my > height * this.y - 45 && my < height * this.y + 35;
        fill(175);
        stroke(0);
        strokeWeight(5);
        rectMode(CENTER);
        // Render Trash Can
        rect(width * this.x, height * this.y, 60, 70);
        line(width * this.x, height * this.y - 35, width * this.x, height * this.y + 35);
        line(width * this.x - 70/4, height * this.y - 35, width * this.x - 70/4, height * this.y + 35);
        line(width * this.x + 70/4, height * this.y - 35, width * this.x + 70/4, height * this.y + 35);
        if (this.hover && dragNDrop[0] != null) {
            rect(width * this.x, height * this.y - 60, 30, 10);
            rect(width * this.x, height * this.y - 50, 70, 10);
        } else {
            rect(width * this.x, height * this.y - 50, 30, 10);
            rect(width * this.x, height * this.y - 40, 70, 10);
        }
    }
}
class GameAlertBox extends GameObject {
    constructor(x, y, w, h, title, desc, col, parent, onClose=null) {
        super(x, y, parent);
        this.w = w;
        this.h = h;
        this.title = title;
        this.desc = desc;
        this.col = col;
        this.onClose = onClose;
    }
    update() {
        rectMode(CENTER);
        fill(200, 200, 200);
        stroke(0);
        strokeWeight(5);
        rect(width * this.x, height * this.y, this.w, this.h);
        fill(this.col);
        textSize(FONT_SIZE * 3/2);
        textAlign(CENTER, CENTER);
        textStyle(BOLD);
        text(this.title, width * this.x, height * this.y - this.h/2 + FONT_SIZE);
        strokeWeight(3);
        textWrap(WORD);
        textSize(FONT_SIZE * 2/3);
        textStyle(NORMAL);
        text(this.desc, width * this.x, height * this.y, this.w * 2/3);
        let mx = mouseX - width/2;
        let my = mouseY - height/2;
        let closeHover = mx > width * this.x + this.w/2 - 110 && mx < width * this.x + this.w/2 - 10 && my > height * this.y - this.h/2 + 10 && my < height * this.y - this.h/2 + 110;
        if (closeHover && mouseIsPressed) {
            if (this.onClose != null) this.onClose();
            this.delete();
        }
        if (closeHover) fill(200, 100, 100); else fill(200, 50, 50);
        ellipse(width * this.x + this.w/2 - 60, height * this.y - this.h/2 + 60, 100);
        if (closeHover) fill(100, 50, 50); else fill(50, 25, 25);
        textSize(FONT_SIZE * 3/2);
        textStyle(BOLD);
        text("⨯", width * this.x + this.w/2 - 60, height * this.y - this.h/2 + 60);
    }
}
// Setup is called when the canvas is loaded
function setup() {
    // Set canvas to be full browser window
    resizeCanvas(windowWidth, windowHeight);
    // Set font to be monospace
    textFont("monospace");
    // Initialise FPS values
    min = 60;
    max = min;
    cur = min;
    // Make Conveyors (vertices as decimals to allow for scaling with window resize)
    for (let i = 0; i < 5; i++) {
        let col = [0, 13, 25, 38, 50, 63, 75, 88, 100];
        col = shuffle(col);
        if (random([true,false])) {
            gameCons.push(
                new GameConveyor(
                    gameCons, color(col[0], col[1], col[2]),
                    [[random()-0.5, -0.6],[random()-0.5, random([-0.3, -0.25, -0.2, -0.15, -0.1])],[random()-0.5, random([0.3, 0.25, 0.2, 0.15, 0.1])],[random()-0.5, 0.6]]
                )
            );
        } else {
            gameCons.push(
                new GameConveyor(
                    gameCons, color(col[0], col[1], col[2]),
                    [[-0.6, random()-0.5],[random([-0.3, -0.25, -0.2, -0.15, -0.1]), random()-0.5],[random([0.3, 0.25, 0.2, 0.15, 0.1]), random()-0.5],[0.6, random()-0.5]]
                )
            );
        }
    }
    // Add Combiner
    gameComs.push(
        new GameCombiner(-0.4, 0.1, -0.1, 0.4, gameComs)
    );
    // Add TrashCan
    gameTras.push(
        new GameTrashCan(0.4, -0.4, gameTras)
    );
    // Add "play" button
    gameInts.push(
        new GameInteract(
            0.1, 0.1, 0.35, 0.3,
            gameInts, "Play",
            color(125, 125, 125, 200), color(200, 125, 125, 200), color(125, 200, 125, 200)
        )
    );
}
// Draw is called every frame
function draw() {
    // Make backround a grey/brown industrial color
    background(150, 140, 130);
    // Make center of screen (0,0)
    translate(width/2, height/2);
    // Draw each GameConveyor, GameCombiner, GameTrashCan, GameInteract
    gameCons.forEach(c => c.update());
    gameComs.forEach(c => c.update());
    gameTras.forEach(t => t.update());
    gameInts.forEach(i => i.update());
    // Render Lock on Play Button - Calcs below
    // -68.75 + 75/2 = -31.25 (offset for arc)
    // -68.75 + 75/2 + 100/2 = 19.75 (offset for rect)
    noFill();
    arc(width * 0.35 - 100/2 - 20, height * (0.1 + 0.3)/2 - 31.25, 75, 75, PI, 0);
    fill(250, 200, 0, 255);
    rectMode(CENTER);
    rect(width * 0.35 - 100/2 - 20, height * (0.1 + 0.3)/2 + 19.75, 100, 100);
    fill(255);
    textSize(FONT_SIZE/3*2);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    text(TARGET, width * 0.35 - 100/2 - 20, height * (0.1 + 0.3)/2 + 19.75, 100, 100);
    // Render Semi-Transparent background for title (don't ask about the magic numbers)
    fill(125, 125, 125, 200);
    rectMode(CORNERS);
    rect(-(FONT_SIZE * 3 * 4), -height/2 + FONT_SIZE * 3/2 -10, (FONT_SIZE * 3 * 4), -height/2 + FONT_SIZE * 3/2 + FONT_SIZE * 3 + FONT_SIZE + 10);
    // Render title + subtitle
    stroke(0);
    strokeWeight(10);
    fill(200, 200, 0);
    textSize(FONT_SIZE * 3);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    text("MENU MAYHEM", 0, -height/2 + FONT_SIZE * 3);
    strokeWeight(5);
    textSize(FONT_SIZE);
    textStyle(NORMAL);
    text("A game of Mathematical Mastery", 0, -height/2 + FONT_SIZE * 3 + FONT_SIZE * 3/2 + FONT_SIZE/2);
    // Draw each GameRational, GameOperator, GameAlertBox
    gameRats.forEach(r => r.update());
    gameOpes.forEach(o => o.update());
    gameAles.forEach(a => a.update());
    // Every 60 Frames add Rational and Operator objects
    if (frameCount % 60 == 0) {
        // Choose what conveyors to add Rational and Operator (cannot be the same)
        let l = [];
        for (let i = 0; i < gameCons.length; i++) {
            l.push(i);
        }
        l = shuffle(l);
        // Generate random Rational and Operator objects and add them to the conveyors determined above
        let r = new GameRational(0, 0, floor(random()*10), 1, gameRats)
        gameRats.push(r);
        gameCons[l[0]].addObject(r);
        let o = new GameOperator(0, 0, random(["+", "-", "⨯", "÷"]), gameOpes);
        gameOpes.push(o);
        gameCons[l[1]].addObject(o);
    }
}
// On WindowResized, resize the canvas to fit the window
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
// On MousePressed Find Highest (1st priority), and Closest (2nd priority) GameRational or GameOperator
function mousePressed() {
    // Instantiate the target to be null below all conveyors and infinite distance away
    let target = null;
    let tHeight = -1;
    let tdist = Number.POSITIVE_INFINITY;
    // Height used to keep track of conveyor index
    let hght = 0;
    let tcon = true;
    // Loop over each child of each conveyor
    gameCons.forEach(con => {
        con.chlds.forEach(chld => {
            // Get the x and y coordinates of child and mouse (relative to centre)
            let cx = chld[0].x;
            let cy = chld[0].y;
            let mx = mouseX - width/2;
            let my = mouseY - height/2;
            // Calculate distance between child and mouse
            let dx = cx - mx;
            let dy = cy - my;
            let cdist = sqrt(dx**2 + dy**2);
            // If (distance is closer than current OR higher than current) AND within the font size, set target, distance and height
            if ((cdist < tdist || hght > tHeight) && cdist < FONT_SIZE/2) {
                target = chld[0];
                tdist = cdist;
                tHeight = hght;
            };
        });
        // Increment height counter
        hght++;
    });
    // Do the same for Rationals not on Conveyors
    gameRats.forEach(rat => {
        if (rat.conveyor) return;
        let rx = rat.x;
        let ry = rat.y;
        let mx = mouseX - width/2;
        let my = mouseY - height/2;
        let dx = rx - mx;
        let dy = ry - my;
        let rdist = sqrt(dx**2 + dy**2);
        if ((rdist < tdist || hght > tHeight) && rdist < FONT_SIZE/2) {
            target = rat;
            tdist = rdist;
            tHeight = hght;
            tcon = false;
        }
    });
    hght++;
    // Do the same for Operators not on Conveyors
    gameOpes.forEach(op => {
        if (op.conveyor) return;
        let ox = op.x;
        let oy = op.y;
        let mx = mouseX - width/2;
        let my = mouseY - height/2;
        let dx = ox - mx;
        let dy = oy - my;
        let odist = sqrt(dx**2 + dy**2);
        if ((odist < tdist || hght > tHeight) && odist < FONT_SIZE/2) {
            target = op;
            tdist = odist;
            tHeight = hght;
            tcon = false;
        }
    });
    // If no target was found, do not try to assign variables
    if (target == null) return;
    // Assign drag'n'drop to target, remove target from conveyor object and tell target it is not on a conveyor
    dragNDrop.splice(0, 1, target);
    if (tcon) gameCons[tHeight].removeObject(target);
    // Remove it from conveyor
    target.offConveyor();
    // Remove object from combiner if it is on it
    if (target.combiner) gameComs[0].removeObject(target);
}
// On MouseDragged, if there is a target, move it to the mouse position (relative to centre)
function mouseDragged() {
    if (dragNDrop[0] == null) return;
    dragNDrop[0].setPos(mouseX - width/2, mouseY - height/2);
}
// On MouseReleased
function mouseReleased() {
    // Only execute code if player has released its hold on a GameObject
    if (dragNDrop[0] == null) return;
    // Get mouse coordinates relative to the centre
    let mx = mouseX - width/2;
    let my = mouseY - height/2;
    // For each combiner, if the mouse is within the bounds, add the object
    gameComs.forEach(comb => {
        if (mx > width * comb.x && mx < width * comb.ex && my > height * comb.y && my < height * comb.ey) {
            comb.addObject(dragNDrop[0]);
        }
    });
    // For each trash can, if the mouse is within the bounds, discard the object.
    gameTras.forEach(tras => {
        if (mx > width * tras.x - 35 && mx < width * tras.x + 35 && my > height * tras.y - 45 && my < height * tras.y + 35) {
            dragNDrop[0].delete();
        }
    });
    // For each play button, if the mouse is within the bounds and the object is number, check if the player has succeeded or lost
    gameInts.forEach(inte => {
        if (dragNDrop[0] instanceof GameRational && mx > width * inte.x && mx < width * inte.ex && my > height * inte.y && my < height * inte.ey) {
            if (gameAles.length == 0) {
                if (dragNDrop[0].getVal() == TARGET) {
                    // Initialise score to be absolute of TARGET
                    let SCORE = abs(TARGET);
                    // Loop through each operation performed
                    operatns.forEach(op => {
                        // Multiplication + Division are worth more points
                        if (!["+", "-"].includes(op)) {
                            SCORE += 5;
                        }
                    });
                    // Penalise for higher operation counts
                    SCORE -= operatns.length;
                    // Do AJAX request to server
                    $.ajax({
                        url: "data.php",
                        method: "POST",
                        data: {type: "insert", name: USERNAME, score: SCORE, target: TARGET},
                        cache: false,
                        success: (res, status, xhr) => {
                            console.log("SUCCESSFULLY ADDED SCORE");
                        },
                        error: (xhr, status, err) => {
                            console.log("ERROR ADDING SCORE");
                            console.log(xhr);
                            console.log(err);
                        }
                    });
                    // Add success alert box
                    gameAles.push(
                        new GameAlertBox(0, 0, width * 3/4, height * 3/4, `SUCCESS! Score: ${SCORE}`,
                            `Your value of ${TARGET} is equal to the target: ${TARGET}! Hence, you have unlocked the play button. Unfortunately, the play button was a lie. This main menu, WAS the game, and you just spent your time enjoying yourself, experimenting with mathematics. Thank you for participating in this trustworthy experiment, Goodbye.`,
                            color(100, 200, 100), gameAles, () => {window.location.reload();}
                        )
                    );
                    dragNDrop[0].delete();
                } else {
                    // Add failure alert box
                    gameAles.push(
                        new GameAlertBox(0, 0, width * 3/4, height * 3/4, "Not Quite.",
                            `Your value of ${dragNDrop[0].getVal()} is not equal to the target: ${TARGET}! Hence, the play button remains locked. We believe that you have the knowledge and brainpower to succeed. Keep experimenting with different numbers and mathematical operators. Use + or ⨯ to increase the magnitude of the number, and - or ÷ to decrease it.`,
                            color(200, 100, 100), gameAles
                        )
                    );
                }
            }
        }
    });
    // Remove object from the dragNDrop list
    dragNDrop.splice(0, 1, null);
}
