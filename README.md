# 2D Physics

Lightweight and easy to use

---
## What can it not do, yet

- Joints
- Rotation
- Constraints
- Collision Groups
- Non sphere/box shapes

## What's included?

Engine + Physics
Environment based structure allows for multiple simulations
Environments do not explicitly require rendering allowing solely data based simulations

Entities can be anchored, but they will still respect overlap rules

Additionally there's a divide(number) method on a entity, which upon using will divide the entity into smaller pieces
Note that boxes do not divide into exact quantities based on the input number
```javascript
// Inside entity class
divide(amount) {
  if (amount <= 1) { return }
  // Imagine code here
}
```
#

> You read this in your head.
>
> — John Psychic
