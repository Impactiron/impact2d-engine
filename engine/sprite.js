import { Component } from './component.js';
export class Sprite extends Component {
  constructor(texture){ super(); this.texture = texture; this.layer = 'default'; this._pixi = null; }
}
