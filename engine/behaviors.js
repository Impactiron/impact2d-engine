// Existing content of engine/behaviors.js

if(this.onPickup){ try { this.onPickup(this.owner); } catch(e) { console.warn('[PickupBehavior] onPickup callback error:', e); } }

// Remaining content of engine/behaviors.js