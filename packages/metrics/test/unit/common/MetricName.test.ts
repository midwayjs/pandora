import {MetricName} from '../../../src/common/MetricName';
import {expect} from 'chai';
import {MetricLevel} from '../../../src/common/MetricLevel';

describe('/test/unit/common/MetricName.test.ts', () => {

  it('test empty', () => {
    expect(JSON.stringify(MetricName.EMPTY.getTags())).to.be.equal(JSON.stringify(MetricName.EMPTY_TAGS));
    expect(MetricName.EMPTY.getKey()).to.be.empty;
    expect(JSON.stringify(new MetricName().getTags())).to.equal(JSON.stringify(MetricName.EMPTY_TAGS));

    expect(MetricName.EMPTY.toString()).to.equal(new MetricName().toString());
    expect(MetricName.build().toString()).to.equal(MetricName.EMPTY.toString());
    expect(MetricName.EMPTY.resolve(null).toString()).to.equal(MetricName.EMPTY.toString());
  });

  it('testResolve', () => {
    let name: MetricName = new MetricName("foo");
    expect(name.resolve("bar").toString()).to.equal(new MetricName("foo.bar").toString());
  });

  it('testResolveWithTags', () => {
    let name: MetricName = new MetricName("foo").tagged("key", "value");
    expect(name.resolve("bar").toString()).to.equal(new MetricName("foo.bar").tagged("key", "value").toString());
  });


  it('testResolveWithoutTags', () => {
    let name: MetricName = new MetricName("foo").tagged("key", "value");
    expect(name.resolve("bar", false).toString()).to.equal(new MetricName("foo.bar").toString());
  });

  it('testResolveBothEmpty', () => {
    let name: MetricName = new MetricName();
    expect(name.resolve(null).toString()).to.equal(new MetricName().toString());
  });

  it('testAddTagsVarious', () => {
    const refTags = {
      foo: 'bar',
    };

    let test: MetricName = MetricName.EMPTY.tagged("foo", "bar");
    let test2: MetricName = MetricName.EMPTY.tagged(refTags);

    expect(test.toString()).to.equal(new MetricName(null, refTags).toString());
    expect(JSON.stringify(test.getTags())).to.equal(JSON.stringify(refTags));

    expect(test2.toString()).to.equal(new MetricName(null, refTags).toString());
    expect(JSON.stringify(test2.getTags())).to.equal(JSON.stringify(refTags));

  });

  it('testTaggedMoreArguments', () => {
    const refTags = {
      foo: 'bar',
      baz: 'biz'
    };

    expect(JSON.stringify(MetricName.EMPTY.tagged("foo", "bar", "baz", "biz").getTags())).to.equal(JSON.stringify(refTags));
  });

  it('testTaggedWithLevel', () => {
    let name: MetricName = MetricName.build("test").setLevel(MetricLevel.CRITICAL);
    let tagged = name.tagged("foo", "bar");
    expect(tagged.getMetricLevel()).to.be.equal(MetricLevel.CRITICAL);
  });

  it('testJoinWithLevel', () => {
    let name: MetricName = MetricName.build("test").setLevel(MetricLevel.CRITICAL);
    let tagged = MetricName.join(name, MetricName.build("abc"));
    expect(tagged.getMetricLevel()).to.be.equal(MetricLevel.CRITICAL);
  });

  it('test join with tags', () => {
    let name: MetricName = MetricName.build("test").tagged({
      hello: 'world'
    });
    let tagged = MetricName.join(name, MetricName.build("abc"));
    expect(tagged.toString()).to.be.equal(new MetricName('test.abc').tagged({
      hello: 'world'
    }).toString());
  });

  it('testResolveWithLevel', () => {
    let name: MetricName = new MetricName("foo").setLevel(MetricLevel.CRITICAL).tagged("key", "value");
    expect(name.resolve("bar").toString()).to.be.equal(new MetricName("foo.bar").tagged("key", "value").setLevel(MetricLevel.CRITICAL).toString());
  });

  it('test parse name', () => {
    let name: MetricName = new MetricName("foo").tagged("key", "value");
    let nameStr = name.getNameKey();

    let newName = MetricName.parseKey(nameStr);
    expect(name.getKey()).to.equal(newName.getKey());
    expect(name.getMetricLevel()).to.equal(newName.getMetricLevel());
    expect(JSON.stringify(name.getTags())).to.equal(JSON.stringify(newName.getTags()));
  });

  it('test build and parse name may be equal', () => {
    expect('test.qps.count@%^@%^NORMAL').to.be.equal(MetricName.parseKey('test.qps.count').toString());
    expect(MetricName.parseKey('test.qps.count').toString()).to.be.equal(MetricName.build('test.qps.count').toString());
  });

  it('test parse and format', () => {
    let metricName = MetricName.parseKey('test.qps.count@%^@%^NORMAL');
    expect(metricName.toString()).to.be.equal('test.qps.count@%^@%^NORMAL');
  });

  it('testTagged with old tag', () => {
    let name: MetricName = MetricName.build("test").tagged('hello', 'world').setLevel(MetricLevel.CRITICAL);
    let tagged = name.tagged("foo", "bar");
    expect(JSON.stringify(tagged.getTags())).to.be.equal(JSON.stringify({
      foo: 'bar',
      hello: 'world',
    }));
  });

});
