import { interfaces } from 'inversify'
import { VMConfig, VM_SYMBOL } from './vm.types'
import { IAPIPropertyFactory } from './api-property/api-property.interface'
import { SystemV1Name } from '../../api/vm/system-v1/system-v1.modules'

export async function getVMConfig(context: interfaces.Context): Promise<VMConfig> {
    const container = context.container

    let apiPropertyFactorySystemV1: IAPIPropertyFactory[] = []
    try {
        apiPropertyFactorySystemV1 = container
            .getAll<IAPIPropertyFactory>(VM_SYMBOL.APIPropertyFactorySystemV1)
    } catch {}

    return {
        maxStoppedScripts: 30,
        maxScriptErrors: 30,
        namespace: 'gefion',
        api: [
            {
                version: SystemV1Name,
                properties: apiPropertyFactorySystemV1
            }
        ]
    }
}