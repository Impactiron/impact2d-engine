/**
 * Impact2D Engine - Enhanced Scene Graph
 * Scene system with proper lifecycle hooks: init, fixedUpdate, update, render
 * Backwards compatible with _init, _fixedUpdate, _update, _render
 */

import { Node as BaseNode } from './node.js';

// Enhanced Node with lifecycle hooks
export class Node extends BaseNode {
  constructor(name = '') {
    super(name);
    this.initialized = false;
  }

  // Lifecycle hooks (override in subclasses)
  init() {}
  fixedUpdate(_dt) {}
  update(_dt) {}
  render(_renderer) {}

  // Internal lifecycle callers with backwards compatibility
  _init() {
    if (this.initialized) return;
    this.initialized = true;

    // Call new hook
    if (this.init && typeof this.init === 'function') {
      this.init();
    }

    // Call components
    for (const comp of this.components) {
      if (comp.onInit && typeof comp.onInit === 'function') {
        comp.onInit();
      } else if (comp.init && typeof comp.init === 'function') {
        comp.init();
      }
    }

    // Initialize children
    for (const child of this.children) {
      if (child._init) {
        child._init();
      }
    }
  }

  _fixedUpdate(dt) {
    // Call new hook
    if (this.fixedUpdate && typeof this.fixedUpdate === 'function') {
      this.fixedUpdate(dt);
    }

    // Call components
    for (const comp of this.components) {
      if (comp.onFixedUpdate && typeof comp.onFixedUpdate === 'function') {
        comp.onFixedUpdate(dt);
      } else if (comp.fixedUpdate && typeof comp.fixedUpdate === 'function') {
        comp.fixedUpdate(dt);
      }
    }

    // Update children
    for (const child of this.children) {
      if (child._fixedUpdate) {
        child._fixedUpdate(dt);
      }
    }
  }

  _update(dt) {
    // Call new hook
    if (this.update && typeof this.update === 'function') {
      this.update(dt);
    }

    // Call components
    for (const comp of this.components) {
      if (comp.onUpdate && typeof comp.onUpdate === 'function') {
        comp.onUpdate(dt);
      } else if (comp.update && typeof comp.update === 'function') {
        comp.update(dt);
      }
    }

    // Update children
    for (const child of this.children) {
      if (child._update) {
        child._update(dt);
      }
    }
  }

  _render(renderer) {
    // Call new hook
    if (this.render && typeof this.render === 'function') {
      this.render(renderer);
    }

    // Call components
    for (const comp of this.components) {
      if (comp.onRender && typeof comp.onRender === 'function') {
        comp.onRender(renderer);
      } else if (comp.render && typeof comp.render === 'function') {
        comp.render(renderer);
      }
    }

    // Render children
    for (const child of this.children) {
      if (child._render) {
        child._render(renderer);
      }
    }
  }

  // Enhanced component management
  getComponent(Ctor) {
    return this.get(Ctor);
  }

  getComponents(Ctor) {
    if (!Ctor) return this.components.slice();
    return this.components.filter(c => c instanceof Ctor);
  }

  hasComponent(Ctor) {
    return this.get(Ctor) !== null;
  }
}

// Enhanced Scene (root node)
export class Scene extends Node {
  constructor(name = 'scene') {
    super(name);
    this.active = true;
  }

  add(child) {
    if (!child) return null;
    this.children.push(child);
    child.parent = this;

    // Auto-initialize if scene is already initialized
    if (this.initialized && child._init) {
      child._init();
    }

    return child;
  }

  remove(child) {
    if (!child) return;
    this.children = this.children.filter(x => x !== child);
    child.parent = null;
  }

  findByName(name) {
    return this.children.find(c => c.name === name) || null;
  }

  findAllByName(name) {
    return this.children.filter(c => c.name === name);
  }

  clear() {
    this.children = [];
  }
}

// Re-export helpers from node.js
export { add, remove, removeAll } from './node.js';
