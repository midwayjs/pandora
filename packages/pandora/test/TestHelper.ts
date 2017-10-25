import {DefaultEnvironment, EnvironmentUtil} from 'pandora-env';
process.env.DEFAULT_WORKER_COUNT = '2';
EnvironmentUtil.getInstance().setCurrentEnvironment(new DefaultEnvironment({
  env: 'test'
}));

