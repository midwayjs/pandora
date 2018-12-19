import {Reservoir} from '../Reservoir';
import {UniformSnapshot} from '../snapshot/UniformSnapshot';
import {Snapshot} from '../domain';

export class UniformReservoir extends Reservoir {

  private static DEFAULT_SIZE = 1028;
  private limit;

  constructor(size: number = UniformReservoir.DEFAULT_SIZE) {
    super();
    this.limit = size;
    this.count = 0;
    this.clear();
  }

  update(value: number) {
    this.count++;
    if (this.size() < this.limit) {
      // console.log("Adding "+val+" to values.");
      this.values.push(value);
    } else {
      let rand = parseInt(<string><any>(Math.random() * this.count));
      if (rand < this.limit) {
        this.values[rand] = value;
      }
    }
  }

  getSnapshot(): Snapshot {
    return new UniformSnapshot(this.values.slice());
  }

}
