import {componentName, dependencies} from 'pandora-component-decorator';

@componentName('reporterManager')
@dependencies(['metrics', 'trace', 'errorLog'])
export default class ComponentReporterManager {
}