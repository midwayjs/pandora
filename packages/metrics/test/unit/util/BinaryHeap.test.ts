import {BinaryHeap} from '../../../src/common/util/BinaryHeap';
import {expect} from 'chai';

describe('/test/unit/util/BinaryHeap.test.ts', () => {
  it('should create new BinaryHeap', function () {
    let heap = new BinaryHeap((obj) => {
      return obj.priority;
    });

    heap.push({
      val: 1,
      priority: 0.2,
    });

    heap.push({
      val: 2,
      priority: 0.1,
    });

    heap.push({
      val: 3,
      priority: 0.3,
    });

    let clone = heap.clone();

    expect(heap.content.length).to.equal(3);
    expect(heap.peek().priority).to.equal(0.1);

    heap.pop();
    expect(heap.content.length).to.equal(2);
    expect(heap.peek().priority).to.equal(0.2);

    heap.remove({val: 3, priority: 0.3});
    expect(() => {
      heap.remove(1);
    }).to.throw();

    expect(clone.size()).to.equal(3);
  });
});
