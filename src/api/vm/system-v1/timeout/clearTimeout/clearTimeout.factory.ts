import { injectable } from 'inversify'
import { 
    IAPIPropertyFactory 
} from '../../../../../core/vm/api-property/api-property.interface'
import { ClearTimeoutName } from './clearTimeout.types'
import { ClearTimeoutAPIProperty } from './clearTimeout.property'
import { ClearTimeoutStats } from './clearTimeout.stats'

@injectable()
export class ClearTimeoutFactory implements IAPIPropertyFactory {

    public async name(): Promise<string> {
        return ClearTimeoutName
    }

    public async isGlobal(): Promise<boolean> {
        return true
    }

    public async stats(): Promise<ClearTimeoutStats> {
        return new ClearTimeoutStats()
    }

    public async apiProperty(): Promise<ClearTimeoutAPIProperty> {
        return new ClearTimeoutAPIProperty
    }

}