import { BlockModule } from './block/block.module'
import { MethodModule } from './method/method.module'
import { SignalModule } from './signal/signal.module'
import { CreatorModule } from './creator/creator.module'
import { MetadataModule } from './metadata/metadata.module'
import { UserModule } from './user/user.module'
import { RouteModule } from './route/route.module'

export const APPModules = [
    BlockModule,
    MethodModule,
    MetadataModule,
    SignalModule,
    CreatorModule,
    UserModule,
    RouteModule
]