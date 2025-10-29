export class Component {
  onInit(){} onAttach(){} onDetach(){}
  onUpdate(dt){} onFixedUpdate(step){} onRender(ctx){}
}
export class Transform extends Component {
  constructor(){ super(); this.position={x:0,y:0}; this.rotation=0; this.scale={x:1,y:1}; }
}
