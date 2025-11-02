// engine/node.js – robust add/remove helpers compatible with Pixi v8
import { Container, DisplayObject } from 'https://unpkg.com/pixi.js@8.2.5/dist/pixi.mjs';

/**
 * Add a DisplayObject to a parent Container in a safe way.
 * - If the child already has a parent, it will be detached first.
 * - Works regardless of custom 'remove' helpers on the child.
 */
export function add(parent, child) {
  if (!parent || !child) return child;
  const cont = (parent instanceof Container) ? parent : (parent.container || parent);
  const obj  = (child instanceof DisplayObject) ? child : (child.container || child);
  if (!cont || !obj) return child;

  // Detach from old parent safely
  try {
    if (obj.parent && obj.parent.removeChild) {
      obj.parent.removeChild(obj);
    } else if (typeof obj.remove === 'function') {
      // some frameworks add a helper; use it when available
      try { obj.remove(); } catch {}
    }
  } catch {}

  try { cont.addChild(obj); } catch {}
  return child;
}

/**
 * Remove a DisplayObject from its current parent safely.
 */
export function remove(child) {
  if (!child) return;
  const obj = (child instanceof DisplayObject) ? child : (child.container || child);
  try {
    if (obj && obj.parent && obj.parent.removeChild) obj.parent.removeChild(obj);
    else if (obj && typeof obj.remove === 'function') obj.remove();
  } catch {}
}

/**
 * Remove all children from a Container.
 */
export function removeAll(parent) {
  if (!parent) return;
  const cont = (parent instanceof Container) ? parent : (parent.container || parent);
  try {
    if (cont && cont.removeChildren) cont.removeChildren();
    else if (cont && Array.isArray(cont.children)) {
      // Fallback: manual detach
      const copy = cont.children.slice();
      for (const c of copy) {
        try { if (c && c.parent && c.parent.removeChild) c.parent.removeChild(c); } catch {}
      }
    }
  } catch {}
}
