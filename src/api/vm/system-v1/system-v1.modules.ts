import { PromiseModule } from './promise/promise.module'
import { TimeoutModules } from './timeout/timeout.modules'
import { IntervalModules } from './interval/interval.modules'
import { ImmediateModules } from './immediate/immediate.modules'

export const SystemV1Name = 'systemV1'

export const SystemV1Modules = [
    PromiseModule,
    ...TimeoutModules,
    ...IntervalModules,
    ...ImmediateModules
]
