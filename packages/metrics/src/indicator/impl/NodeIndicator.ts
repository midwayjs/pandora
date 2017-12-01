/**
 * 系统指标
 */

import {Indicator} from '../Indicator';
import {IBuilder, IndicatorScope} from '../../domain';

export class NodeIndicator extends Indicator {

  group: string = 'info';

  async invoke(data: any, builder: IBuilder) {
    builder.withDetail('node', {
      node: process.version,
      alinode: (<any> process).alinode || '',
      path: process.argv[0],
      versions: process.versions,
      features: (<any> process).features,
    }, IndicatorScope.SYSTEM);

  }
}
