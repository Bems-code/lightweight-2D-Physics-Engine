// @ts-check
/*

  Physics Engine designed for use inside html <canvas>
  Only supports 2D collisions

*/

//----------------- CLASSES --------------\\
import { entity, enitityParams, sphere, box, Vector2 } from './classes.js'

//---------------- TEMPLATES ---------------\\

const defualtParams = new enitityParams('box', 'white', true, false, 25, [0, 0])
const errorParams = new enitityParams('box', 'hsl(300, 100%, 50%)', true, true, 1, [0, 1])
const nVector = new Vector2()

//------------- PHYSICS METHODS -------------\\

/** // now supporting anchors!
 * @param {box | sphere | entity} entity1
 * @param {box | sphere | entity} entity2
 * @param {number} restitute
 * @param {number} nx
 * @param {number} ny
 */
function calculateCollision(entity1, entity2, restitute, nx, ny) {

  // Changed direction of relative velocity
  const vx1 = entity1.velo.x
  const vy1 = entity1.velo.y
  const vx2 = entity2.velo.x
  const vy2 = entity2.velo.y

  // Check if both are anchored
  const invMass = entity1.invMass + entity2.invMass
  if (invMass < 1e-4) {
    return {
      vx1_new: vx1,
      vy1_new: vy1,
      vx2_new: vx2,
      vy2_new: vy2
    }
  }

  const anch1 = entity1.anchored
  const anch2 = entity2.anchored
  const vrx = vx2 - vx1;
  const vry = vy2 - vy1;

  const vn = (vrx * nx) + (vry * ny);

  if (vn > 0) {
    return {
      vx1_new: vx1,
      vy1_new: vy1,
      vx2_new: vx2,
      vy2_new: vy2
    };
  }

  const j = (-(1 + restitute) * vn) / invMass;

  const vx1_new = anch1 ? vx1 : vx1 - (j * nx) / entity1.mass
  const vy1_new = anch1 ? vy1 : vy1 - (j * ny) / entity1.mass
  const vx2_new = anch2 ? vx2 : vx2 + (j * nx) / entity2.mass
  const vy2_new = anch2 ? vy2 : vy2 + (j * ny) / entity2.mass


  return { vx1_new, vy1_new, vx2_new, vy2_new };
}

//------------- OVERLAP METHODS -------------\\

/**
* @param   {sphere} sphere
* @param   {box} box
*/
function resolveRectSphereOverlap(sphere, box) {

  const { closeX, closeY } = box.nearestEdge(sphere.pos.x, sphere.pos.y)

  nVector.set(closeX, closeY).sub(sphere.pos)

  const distance = nVector.lengthSq();

  // CHECK IF SPHERE COLLIDED
  if (distance > (sphere.radius ** 2)) { return }

  const trueDistance = nVector.normalize(distance)
  
  // Resolve overlap
  const overlap = (sphere.radius) - trueDistance;
  const cx = overlap * nVector.x;
  const cy = overlap * nVector.y;


  if (sphere.anchored === box.anchored) {

    sphere.pos.x -= cx;
    sphere.pos.y -= cy;
    box.pos.x += cx;
    box.pos.y += cy;

  } else if (sphere.anchored) {

    box.pos.x += cx;
    box.pos.y += cy;

  } else {

    sphere.pos.x -= cx;
    sphere.pos.y -= cy;

  }

  const { vx1_new, vy1_new, vx2_new, vy2_new } = calculateCollision(sphere, box, 1, nVector.x, nVector.y);

  sphere.velo.set(vx1_new, vy1_new)
  box.velo.set(vx2_new, vy2_new)
}
/**
* @param   {sphere} sphere1
* @param   {sphere} sphere2
*/
function resolveSphereOverlap(sphere1, sphere2) {

  nVector.copy(sphere2.pos).sub(sphere1.pos)

  const distance = nVector.lengthSq();

  const radi = sphere1.radius + sphere2.radius

  // NO COLLISION
  if (distance > radi ** 2) { return }

  const trueDistance = nVector.normalize(distance)


  // Resolve overlap
  const overlap = (sphere1.radius + sphere2.radius) - trueDistance;
  const cx = overlap * nVector.x;
  const cy = overlap * nVector.y;

  if (sphere1.anchored === sphere2.anchored) {

    sphere1.pos.x -= cx;
    sphere1.pos.y -= cy;
    sphere2.pos.x += cx;
    sphere2.pos.y += cy;


  } else if (sphere1.anchored) {

    sphere2.pos.x += cx;
    sphere2.pos.y += cy;

  } else {

    sphere1.pos.x -= cx;
    sphere1.pos.y -= cy;

  }

  const { vx1_new, vy1_new, vx2_new, vy2_new } = calculateCollision(sphere1, sphere2, 1, nVector.x, nVector.y);

  sphere1.velo.set(vx1_new, vy1_new)
  sphere2.velo.set(vx2_new, vy2_new)
}

/**
* @param   {box} box1
* @param   {box} box2
*/
function resolveBoxOverlap(box1, box2) {

  // CHECK IF BOX CANT POSSIBLY BE COLLIDING
  if (box2.bottom > box1.top || box2.top < box1.bottom) { return }

  const dx = box1.right - box2.left
  const dy = Math.min(box1.top - box2.bottom, box2.top - box1.bottom)

  // woaw!
  nVector.set(dx, dy).normalize()

  const absY = Math.abs(dy);

  /** @type {'x' | 'y'} */
  let axis, push;

  if (dx < absY) {
    axis = 'x';
    push = dx; // Already positive, no sign multiplication needed!
  } else {
    axis = 'y';
    push = dy; // Keeps its original + or - sign automatically!
  }

  if (box1.anchored === box2.anchored) {
    const halfPush = push * 0.5;
    box1.pos[axis] -= halfPush;
    box2.pos[axis] += halfPush;
  } else if (box1.anchored) {
    box2.pos[axis] += push;
  } else {
    box1.pos[axis] -= push;
  }

  //! FIX THIS OH MY DAYS
  const { vx1_new, vy1_new, vx2_new, vy2_new } = calculateCollision(box2, box1, 1, nVector.x, nVector.y);

  box1.velo.set(vx1_new, vy1_new)
  box2.velo.set(vx2_new, vy2_new)
}


//------------- DRIVER METHODS -------------\\

/** @param {[entity | sphere | box]} entityList */
function findCollisions(entityList) {

  const sortedSpheres = entityList.sort((a, b) => a.left - b.left);
  for (let i = 0; i < sortedSpheres.length; i++) {
    const entity1 = sortedSpheres[i]
    if (!entity1.canCollide) { continue }

    for (let j = i + 1; j < sortedSpheres.length; j++) {
      const entity2 = sortedSpheres[j]

      if (entity2.left > entity1.right) { break }
      if (!entity2.canCollide) { continue }


      if (entity1.radius && entity2.radius) { resolveSphereOverlap(entity1, entity2) }
      else if (entity1.width && entity2.width) { resolveBoxOverlap(entity1, entity2) }
      else {
        let sphere = entity1.radius ? entity1 : entity2
        let box = sphere === entity2 ? entity1 : entity2


        resolveRectSphereOverlap(sphere, box)
      }
    }
  }
}

//------------- EXPORTED STUFF -------------\\
class enviroment {

  //@ts-ignore
  #canvas

  constructor() {

    /** @type {[entity]} entity */
    //@ts-ignore
    this.entityList = []

    this.interval = undefined
    this.tickRate = 16
    this.tickState = false

    /** @type {CanvasRenderingContext2D} */
    this.ctx
    this.absWidth = 0
    this.absHeight = 0

  }

  /** @param {HTMLCanvasElement} canvas */
  set canvas(canvas) {
    this.ctx = canvas.getContext("2d");
    this.absWidth = canvas.width
    this.absHeight = canvas.height
    this.#canvas = canvas
  }
  get canvas() { return this.#canvas }

  _drawStep() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    findCollisions(this.entityList)

    for (const entity of this.entityList) {
      entity.stepMovement()
      entity.draw()
      entity._ticked = !this.tickState
    }

    this.tickState = !this.tickState
  }

  _basicStep() {
    findCollisions(this.entityList)

    for (const entity of this.entityList) {

      entity.stepMovement()
      entity._ticked = !this.tickState
    }

    this.tickState = !this.tickState

  }

  /** @param {...entity} entities */
  pushEntity(...entities) {
    for (const entity of entities) {

      if (entity._enviroment) {

        const index = entity._enviroment.entityList.indexOf(entity);

        if (index !== -1) {
          entity._enviroment.entityList.splice(index, 1);
        }
      }

      entity._enviroment = this
      entity._ticked = this.tickState
    }

    this.entityList.push(...entities)
  }

  run() {
    let stepMethod = !this.canvas ? this._basicStep : this._drawStep
    this.interval = setInterval(stepMethod.bind(this), this.tickRate)
  }

  pause() {
    if (!this.interval) { return }
    clearInterval(this.interval)
    this.interval = null
  }
}

/**
* @param {enitityParams} params
* @returns {sphere | box | entity}
*/
function entityCreate(params = defualtParams) {
  let entity = params.type === 'sphere' ? new sphere(params) : params.type === 'box' ? new box(params) : null
  if (!entity) { console.error('__INVALID_ENTITY_TYPE__'); return new box(errorParams) }

  return entity
}

const Physics = {
  'enviroment': enviroment,
  'entityCreate': entityCreate,
  'enitityParams': enitityParams,
}

export { Physics } // bugs = some; code = good; performance = max
