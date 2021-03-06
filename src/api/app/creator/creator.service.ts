import { injectable, inject } from 'inversify'
import { 
    BindableCreator, 
    BindableResource, 
    CreatorType,
    ResourceType
} from './creator.types'
import { TYPEORM_SYMBOL } from '../../../core/typeorm/typeorm.types'
import { ICreatorService } from './creator.interface'
import { Connection } from 'typeorm'
import { Creator } from '../entities/creator.entity'
import { BlockInstance } from '../entities/block.entity'
import { ResourceAlreadyHasCreator } from './creator.errors'
import { isErrorCode, SqliteErrorCode } from '../../../core/typeorm/utils/error-code'
import { mutationQuery } from '../../../core/typeorm/utils/mutation-query'

@injectable()
export class CreatorService implements ICreatorService {

    public constructor(
        @inject(TYPEORM_SYMBOL.TypeOrmConnectionApp)
        private connection: Promise<Connection> 
    ) {}

    public async bind(resource: BindableResource, creator: BindableCreator, nestedTransaction = false): Promise<void> {
        const connection = await this.connection
        const creatorRepository = connection.getRepository(Creator)
        const creatorEntity = creatorRepository.create()
        
        switch (resource.type) {
            case ResourceType.Method:
                creatorEntity.method = { id: resource.id } as any
                break
            case ResourceType.Signal:
                creatorEntity.signal = { id: resource.id } as any
                break
            case ResourceType.Role:
                creatorEntity.role = { id: resource.id } as any
                break
            case ResourceType.Permission:
                creatorEntity.permission = { id: resource.id } as any
                break
            case ResourceType.Controller:
                creatorEntity.controller = { id: resource.id } as any
                break
            case ResourceType.Middleware:
                creatorEntity.middleware = { id: resource.id } as any
                break
            case ResourceType.MiddlewareGroup:
                creatorEntity.middlewareGroup = { id: resource.id } as any
                break
            case ResourceType.Route:
                creatorEntity.route = { id: resource.id } as any
                break
            case ResourceType.Guard:
                creatorEntity.guard = { id: resource.id } as any
                break
            case ResourceType.Filter:
                creatorEntity.filter = { id: resource.id } as any
                break
            case ResourceType.Validator:
                creatorEntity.validator = { id: resource.id } as any
                break
        }

        switch (creator.type) {
            case CreatorType.System:
                creatorEntity.system = true
                break
            case CreatorType.BlockInstance:
                creatorEntity.blockInstance = { id: creator.id } as any
                break
        }

        try {
            await mutationQuery(nestedTransaction, () => {
                return creatorRepository.save(creatorEntity)
            })
        } catch(error) {
            if (isErrorCode(error, SqliteErrorCode.SQLITE_CONSTRAINT_UNIQUE)) {
                throw new ResourceAlreadyHasCreator
            }

            throw error
        }
    }

    public async getCreator(resource: BindableResource): Promise<BlockInstance | CreatorType.System | undefined> {
        const connection = await this.connection
        const creatorRepository = connection.getRepository(Creator)

        const creatorEntity = await creatorRepository.findOne({
            where: (() => {
                switch (resource.type) {
                    case ResourceType.Method:
                        return { methodId: resource.id }
                    case ResourceType.Signal:
                        return { signalId: resource.id }
                    case ResourceType.Role:
                        return { roleId: resource.id }
                    case ResourceType.Permission:
                        return { permissionId: resource.id }
                    case ResourceType.Controller:
                        return { controllerId: resource.id }
                    case ResourceType.Middleware:
                        return { middlewareId: resource.id }
                    case ResourceType.MiddlewareGroup:
                        return { middlewareGroupId: resource.id }
                    case ResourceType.Route:
                        return { routeId: resource.id }
                    case ResourceType.Guard:
                        return { guardId: resource.id }
                    case ResourceType.Filter:
                        return { filterId: resource.id }
                    case ResourceType.Validator:
                        return { validatorId: resource.id }
                }
            })(),
            relations: ['blockInstance']
        })

        if (!creatorEntity) {
            return
        }

        if (creatorEntity.system) {
            return CreatorType.System
        } else {
            if (creatorEntity.blockInstance) {
                return creatorEntity.blockInstance
            }
        }

        return
    }

    public async isResourceCreator(resource: BindableResource, creator: BindableCreator): Promise<boolean> {
        const creatorEntity = await this.getCreator(resource)

        if (!creatorEntity) {
            return false
        }

        if (creatorEntity === CreatorType.System) {
            if (creator.type === CreatorType.System) {
                return true
            }
        } else {
            if (creatorEntity instanceof BlockInstance) {
                if (creator.type === CreatorType.BlockInstance) {
                    if (creator.id === creatorEntity.id) {
                        return true
                    }
                }
            }
        }

        return false
    }

}