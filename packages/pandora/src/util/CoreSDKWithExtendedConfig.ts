import {CoreSDK, ICoreSDKOptions} from 'pandora-core-sdk';
import {dirname} from 'path';

export class CoreSDKWithExtendedConfig extends CoreSDK {
  constructor(options: ICoreSDKOptions) {
    if(!options.extendConfig) {
      options.extendConfig = [];
    }
    options.extendConfig.push({
      config: require('../pandoraConfig'),
      configDir: dirname(require.resolve('../pandoraConfig'))
    });
    super(options);
  }
}
