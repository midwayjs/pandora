import {Facade} from '../../src/Facade';
import {Hub} from '../../src/hub/Hub';
import {expect} from 'chai';

describe('Subscribe', () => {


  let facade: Facade;
  let hub: Hub;

  before(async () => {
    hub = new Hub;
    facade = new Facade;
    facade.setup({
      location: {
        appName: 'test'
      }
    });
    await hub.start();
    await facade.start();
  });

  after(async () => {
    await facade.stop();
    await hub.stop();
  });

  it('should initConfigManager be ok', async () => {
    await facade.initConfigManager();
  });

  it('should initConfigClient be ok', async () => {
    await facade.initConfigClient();
  });

  it('should publish and getConfig be ok', async () => {
    const configManager = facade.getConfigManager();
    const configClient = facade.getConfigClient();
    await configManager.publish('test_topic', 'test_content_1');
    const res1 = await configClient.getConfig('test_topic');
    expect(res1).to.be.equal('test_content_1');
  });

  it('should callback be ok when just subscribed / 1', async () => {
    const configClient = facade.getConfigClient();
    let gotContent;
    await configClient.subscribe('test_topic', (content) => {
      gotContent = content;
    });
    expect(gotContent).to.be.equal('test_content_1');
  });

  it('should callback be ok when just subscribed / 2', async () => {
    const configClient = facade.getConfigClient();
    let gotContent;
    await configClient.subscribe('test_topic', (content) => {
      gotContent = content;
    });
    expect(gotContent).to.be.equal('test_content_1');
  });

  it('should getConfig() be ok', async () => {
    const configManager = facade.getConfigManager();
    const configClient = facade.getConfigClient();

    await configManager.publish('test_topic2', 'test_content_2');

    const allConfig1 = await configClient.getConfig();
    expect(allConfig1).to.deep.eql( { test_topic: 'test_content_1', test_topic2: 'test_content_2' } );

    const allConfig2 = configManager.getConfig();
    expect(allConfig2).to.deep.eql( { test_topic: 'test_content_1', test_topic2: 'test_content_2' } );
  });

  it('should getAllTopics() be ok', async () => {

    const configManager = facade.getConfigManager();
    const configClient = facade.getConfigClient();

    await configManager.publish('test_topic', '123');
    await configManager.publish('prefix_topic1', '123');
    await configManager.publish('prefix_topic2', '456');
    await configManager.publish('prefix_topic3', '789');

    await configClient.subscribe('test_topic', () => { });
    await configClient.subscribe('prefix_topic1', () => { });
    await configClient.subscribe('prefix_topic3', () => { });


    const topics1 = configManager.getAllSubscribedTopics('prefix_');
    expect(topics1).to.deep.eql([ 'prefix_topic1', 'prefix_topic3' ]);

    const topics2 = configManager.getAllSubscribedTopics();
    expect(topics2).to.deep.eql([ 'test_topic', 'prefix_topic1', 'prefix_topic3' ]);

  });


});

