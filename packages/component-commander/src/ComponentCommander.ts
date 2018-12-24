import {componentName, dependencies} from 'pandora-component-decorator';

@componentName('commander')
@dependencies(['ipcHub'])
export default class ComponentCommander {
}