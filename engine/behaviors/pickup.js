// engine/behaviors/pickup.js
// Removes entity on trigger and increments HUD counter.
// Stub-only; integrate with your collision/trigger system.

export function createPickupBehavior(opts={}){
  const { hudKey = "gems", amount = 1, despawnDelay = 0 } = opts;
  let elapsed = 0;
  let picked = false;

  return {
    name: "pickup",
    onAttach(entity){
      // hook into your trigger system; here we just log
      console.debug(`[pickup] attached to ${entity.id ?? "entity"}`, { hudKey, amount });
    },
    update(dt, entity, manager){
      if(picked){
        if(despawnDelay > 0){
          elapsed += dt;
          if(elapsed >= despawnDelay){
            entity._despawn = true;
            this._done = true;
          }
        } else {
          entity._despawn = true;
          this._done = true;
        }
        return;
      }

      // TODO: replace with actual player-overlap check
      if(entity._simulatePickup){ // test flag for demos
        picked = true;
        // TODO: HUD.increment(hudKey, amount)
        console.log(`[pickup] +${amount} to ${hudKey}`);
      }
    },
    onDetach(entity){
      console.debug(`[pickup] detached from ${entity.id ?? "entity"}`);
    }
  };
}
