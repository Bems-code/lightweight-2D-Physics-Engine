// @ts-check
/*

  Classes for Physics Engine designed for use inside html <canvas>
  Only supports 2D collisions

*/

//------------- VECTOR CLASS ----------------\\

class Vector2 {

  /** @param   {number} x; @param   {number} y*/
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /** @param   {number} x; @param   {number} y  @returns {Vector2} */
  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  /** @param   {Vector2} v  @returns {Vector2} */
  copy(v) {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  /** @returns {Vector2} */
  reset() {
    this.x = 0;
    this.y = 0;
    return this;
  }

  /** @param   {Vector2} v  @returns {Vector2} */
  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  /** @param   {Vector2} v  @returns {Vector2} */
  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  /** @param   {number} scalar @returns {Vector2} */
  scale(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  lengthSq() {
    return this.x * this.x + this.y * this.y;
  }

  /** @param   {number} lenSq  @returns {number} */
  normalize(lenSq = this.lengthSq()) {
    if (lenSq < 1e-8) {
      this.set(0, 1);
      return 0
    }
    const len = Math.sqrt(lenSq);
    this.scale(1 / len);
    return len;
  }
}

//----------------- ENTITY CLASSES -----------------\\

class enitityParams {
  /**
  * @param   {'box' | 'sphere'} type
  * @param   {string} color
  * @param   {boolean} canCollide
  * @param   {boolean} anchored
  * @param   {number} mass
  * @param   {[number, number]} accel
  * // Not needed, will default if not specified || also sucks since it requries specific order
  */// The Order itself is based on: Visuals -> Toggles -> Physics data
  constructor(type, color, canCollide, anchored, mass, accel) {

    this.type = type || 'box'
    this.color = color || `hsl(${Math.random() * 360}, 50%, 50%)`
    this.canCollide = canCollide || false
    this.anchored = anchored || false
    this.mass = mass || 1
    this.accel = accel || [0, 0]
  }
}

class entity {
  
  #mass;
  
  /** @param   {enitityParams} Params */
  constructor(Params) {

    if (!Params) { throw new Error('__MISSING_PARAMS__') }
    
    this.type = Params.type

    // do wtv idc
    this.pos = new Vector2()
    this.velo = new Vector2()
    this.accel = new Vector2(Params.accel[0], Params.accel[1])


    //this.friction = 0.1   // bruh add this already // bruuuu
    this.mass = Params.mass
    this.invMass = !Params.anchored ? 1 / this.mass : 0
    this.anchored = Params.anchored
    this.canCollide = Params.canCollide

    this.color = Params.color

    /** @type {enviroment} entity */
    //@ts-ignore
    this._enviroment = null
    this._ticked = false
  }

  get _params() {

    return new enitityParams(this.type, this.color, this.canCollide, this.anchored, this.mass, [this.accel.x, this.accel.y])
  }

  // Placeholders
  get top() { return this.pos.y }
  get left() { return this.pos.x }
  get right() { return this.pos.x }
  get bottom() { return this.pos.y }
  draw() { }

  /** @param   {number} amount */
  divide(amount) { }

  /** @param   {number} x; @param   {number} y; @returns {{closeX: number, closeY: number}} */
  nearestEdge(x, y) { return { closeX: this.pos.x, closeY: this.pos.y } }

  /*
  // Call whenever a collision happens, such as inside the stepMovement, or collision resolves
  // May add a method to listen to collisions through Signal, but right now it has to be called manually
  
  // Example usage demonstrates string sent through a Signal Module
  // .collision('__WALL_LEFT__') || .collision('__ENTITY_SPHERE__')
  /** @param   {string} string
  collision(string) { Network.collisionEvent.Fire(string) } */

  /** @param   {number} num */
  set mass(num) {
    
    if (typeof(num) !== "number" || Number.isNaN(num)) { console.error('__INVALID_MASS_INPUT__') }

    this.#mass = num;
    this.invMass = (this.anchored || num === 0 || num === Infinity || num === -Infinity) ? 0 : 1 / num;
  }

  get mass() { return this.#mass; }

  /** @param   {boolean} boolean */
  set anchored(boolean) {
    this.invMass = !boolean ? 1 / this.mass : 0
  }

  get anchored() {
    return this.invMass === 0 ? true : false
  }

  // call this however many times per frame
  stepMovement() {

    this.velo.x += this.accel.x
    this.velo.y += this.accel.y

    this.pos.x += this.velo.x
    this.pos.y += this.velo.y

    if (this.left <= 0) {
      this.velo.x *= -1
      this.pos.x -= this.left

    }
    else if (this.right >= this._enviroment.absWidth) {
      this.velo.x *= -1
      this.pos.x += (this._enviroment.absWidth - this.right)

    }

    if (this.bottom <= 0) {
      this.velo.y *= -1
      this.pos.y -= this.bottom

    }
    else if (this.top >= this._enviroment.absHeight) {
      this.velo.y *= -1
      this.pos.y += (this._enviroment.absHeight - this.top)

    }
  }
}

//----------------- SHAPE CLASSES -----------------\\

class sphere extends entity {

  /** @param   {enitityParams} Params */
  constructor(Params) {
    super(Params)

    this.radius = 1
  }

  get bottom() {
    return this.pos.y - this.radius;
  }

  get top() {
    return this.pos.y + this.radius;
  }

  get left() {
    return this.pos.x - this.radius;
  }

  get right() {
    return this.pos.x + this.radius;
  }

  /**
  * @param   {number} x
  * @param   {number} y
  */
  nearestEdge(x, y) {

    const dx = x - this.pos.x
    const dy = y - this.pos.y

    const distance = Math.sqrt((dx ** 2) + (dy ** 2));

    if (distance === 0) {
      return { closeX: this.left, closeY: this.pos.y };
    }

    return {
      closeX: this.pos.x + (dx / distance) * this.radius,
      closeY: this.pos.y + (dy / distance) * this.radius
    };
  }

  draw() {

    this._enviroment.ctx.beginPath();
    this._enviroment.ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2);
    this._enviroment.ctx.fillStyle = this.color;
    this._enviroment.ctx.fill();
    this._enviroment.ctx.closePath();

  }
  /** @param   {number} amount */
  divide(amount) {

    if (amount <= 1) { return }

    const params = this._params
    const invAmount = 1 / amount

    const splitRadi = this.radius * invAmount
    if (splitRadi < 1) { return }

    const splitMass = this.mass * invAmount
    const distanceRadi = splitRadi * (amount / 2.3)
    const step = (2 * Math.PI) * invAmount

    // ogs
    const centerX = this.pos.x
    const centerY = this.pos.y

    const baseVeloX = this.velo.x * invAmount
    const baseVeloY = this.velo.y * invAmount

    const splitVelo = Math.sqrt(baseVeloX ** 2 + baseVeloY ** 2)

    this.pos.set(centerX + distanceRadi, centerY)
    this.velo.set(baseVeloX + splitVelo, baseVeloY)
    this.radius = splitRadi
    this.mass = splitMass

    for (let i = 1; i < amount; i++) {
      const ball = new sphere(params) // Avoid shadowing the class name
      const angle = i * step

      const normalX = Math.cos(angle)
      const normalY = Math.sin(angle)

      ball.pos.set(
        centerX + normalX * distanceRadi,
        centerY + normalY * distanceRadi
      )

      ball.velo.set(
        baseVeloX + normalX * splitVelo,
        baseVeloY + normalY * splitVelo
      )

      ball.radius = splitRadi
      ball.mass = splitMass
    }

  }
}

class box extends entity {

  /** @param   {enitityParams} Params */
  constructor(Params) {
    super(Params)

    this.width = 1
    this.height = 1
  }

  get bottom() {
    return this.pos.y - (this.height / 2);
  }

  get top() {
    return this.pos.y + (this.height / 2);
  }

  get left() {
    return this.pos.x - (this.width / 2);
  }

  get right() {
    return this.pos.x + (this.width / 2);
  }

  /**
  * @param   {number} x
  * @param   {number} y
  */ // we find cloeset edge based on pos || needed for collisions
  nearestEdge(x, y) {

    let closeX = x;
    let closeY = y;

    if (x > this.right) { closeX = this.right; }
    else if (x < this.left) { closeX = this.left }

    if (y > this.top) { closeY = this.top; }
    else if (y < this.bottom) { closeY = this.bottom; }


    return { closeX, closeY }
  }

  draw() {
    this._enviroment.ctx.beginPath();
    this._enviroment.ctx.rect(this.left, this.bottom, this.width, this.height);
    this._enviroment.ctx.fillStyle = this.color;
    this._enviroment.ctx.fill();
    this._enviroment.ctx.closePath();
  }

  /** @param   {number} amount */
  divide(amount) {

    if (amount <= 1) { return }

    const params = this._params
    const invAmount = 1 / amount
    const stepWidth = Math.ceil(Math.sqrt(amount))
    const stepHeight = Math.ceil(amount / stepWidth)
    const splitWidth = this.width / stepWidth
    const splitHeight = this.height / stepHeight
    const splitMass = this.mass * invAmount

    // ogs
    const centerX = this.pos.x
    const centerY = this.pos.y

    const baseVeloX = this.velo.x * invAmount
    const baseVeloY = this.velo.y * invAmount

    const splitVelo = Math.sqrt(baseVeloX ** 2 + baseVeloY ** 2)


    for (let i = 1; i <= stepWidth; i++) {
      for (let j = 1; j <= stepHeight; j++) {
        if (j === stepHeight && i == stepWidth) { break }

        const square = new box(params)
        square.pos.set((splitWidth * i) + this.left, (splitHeight * j) + this.bottom)
        square.mass = splitMass
        square.width = splitWidth
        square.height = splitHeight

        const dx = centerX - square.pos.x
        const dy = centerY - square.pos.y
        const invDistance = 1 / Math.sqrt(dx ** 2 + dy ** 2)

        // scale scale scale scale scale scale scale
        square.velo.set(dx, dy).scale(invDistance).scale(splitVelo)

      }
    }

    this.pos.set((splitWidth * stepWidth) + this.left, (splitHeight * stepHeight) + this.bottom)
    this.mass = splitMass
    this.width = splitWidth
    this.height = splitHeight
    this.mass = splitMass

    const dx = centerX - this.pos.x
    const dy = centerY - this.pos.y
    const invDistance = 1 / Math.sqrt(dx ** 2 + dy ** 2)

    // scale scale scale scale scale scale scale (pt. 2)
    this.velo.set(dx, dy).scale(invDistance).scale(splitVelo)
  }
}


export { entity, enitityParams, sphere, box, Vector2 } 
