import 'reflect-metadata'
import { Container, interfaces } from 'inversify'
import { FsModule } from './dep/fs/fs.module'
import { GitModule } from './dep/git/git.module'
import { LoggerModule } from './dep/logger/logger.module'
import { PackageStoreModule } from './core/package-store/package-store.module'
import { TypeOrmModule } from './dep/typeorm/typeorm.module'
import { ScheduleNodeModule } from './dep/schedule-node/schedule-node.module'
import { ScheduleModule } from './core/schedule/schedule.module'

let container: interfaces.Container

export async function getContainer(): Promise<interfaces.Container> {
    if (!container) {
        container = new Container
        
        await container.loadAsync(
            FsModule,
            GitModule,
            LoggerModule,
            PackageStoreModule,
            TypeOrmModule,
            ScheduleNodeModule,
            ScheduleModule
        )
    }

    return container
}