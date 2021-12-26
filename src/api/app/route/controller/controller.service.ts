import { injectable, inject } from 'inversify'
import { IControllerService } from './controller.interface'
import { ControllerMetadata, CreateController } from './controller.types'
import { METHOD_SYMBOL } from '../../method/method.types'
import { Connection, Repository } from 'typeorm'
import { TYPEORM_SYMBOL } from '../../../../core/typeorm/typeorm.types'
import { transaction } from '../../../../core/typeorm/utils/transaction'
import { mutationQuery } from '../../../../core/typeorm/utils/mutation-query'
import { getCustomRepository } from '../../../../core/typeorm/utils/custom-repository'
import { ICreatorService } from '../../creator/creator.interface'
import { CREATOR_SYMBOL, ResourceType } from '../../creator/creator.types'
import { Controller } from '../../entities/route.entity'
import { SnapshotMetadata } from '../../metadata/metadata.types'
import { MetadataRepository } from '../../metadata/repositories/metadata.repository'
import { IMethodService } from '../../method/method.interface'
import {
    ControllerMethodNotDefined,
    ControllerDoesNotExists
} from './controller.errors'
import { Metadata } from '../../entities/metadata.entity'
import { MethodUsedError } from '../../method/method.errors'

@injectable()
export class ControllerService implements IControllerService {

    private controllerRepository: Promise<Repository<Controller>>
    private connection: Promise<Connection>

    public constructor(
        @inject(TYPEORM_SYMBOL.TypeOrmConnectionApp)
        connection: Promise<Connection>,

        @inject(CREATOR_SYMBOL.CreatorService)
        private creatorService: ICreatorService,

        @inject(METHOD_SYMBOL.MethodService)
        private methodService: IMethodService
    ) {
        this.connection = connection
        this.controllerRepository = connection.then(connection => {
            return connection.getRepository(Controller)
        })
    }

    public async createIfNotExists(options: CreateController, nestedTransaction = false): Promise<void> {
        const controllerRepository = await this.controllerRepository
        const connection = await this.connection

        if (await this.isExists(options.name)) {
            return
        }

        const methodId = await this.methodService.getMethodId(options.method)

        if (!methodId) {
            throw new ControllerMethodNotDefined
        }

        /**
         * Оборачиваю запрос в транзакцию в том числе из-за каскадного сохранения
         * метаданных
         */
        await transaction(nestedTransaction, connection, async () => {
            const controllerEntity = await mutationQuery(true, () => {
                return controllerRepository.save({
                    name: options.name,
                    metadata: {
                        metadata: {
                            custom: null
                        }
                    },
                    method: { id: methodId }
                })
            })

            await this.creatorService.bind({
                type: ResourceType.Controller,
                id: controllerEntity.id
            }, options.creator, true)
        })
    }

    public async isExists(name: string): Promise<boolean> {
        const controllerRepository = await this.controllerRepository
        return await controllerRepository.count({
            where: {
                name: name
            }
        }) > 0
    }

    public async setMetadata(name: string, snapshotMetadata: SnapshotMetadata<ControllerMetadata>, nestedTransaction = false): Promise<void> {
        const connection = await this.connection
        const metadataRepository = getCustomRepository(connection, MetadataRepository)
        const controllerRepository = await this.controllerRepository

        const controllerEntity = await controllerRepository.findOne({
            where: {
                name: name
            }
        })

        if (!controllerEntity) {
            throw new ControllerDoesNotExists
        }

        controllerEntity.metadata.metadata.custom = snapshotMetadata.metadata.custom
        await metadataRepository.update(controllerEntity.metadata.id, {
            metadata: controllerEntity.metadata.metadata,
            revisionNumber: snapshotMetadata.revisionNumber
        }, nestedTransaction)
    }

    public async remove(name: string, nestedTransaction = false): Promise<void> {
        const connection = await this.connection
        const controllerRepository = await this.controllerRepository
        const metadataRepository = connection.getRepository(Metadata)

        const controllerEntity = await controllerRepository.findOne({
            where: {
                name: name
            },
            relations: ['method']
        })

        if (!controllerEntity) {
            return
        }
        
        await transaction(nestedTransaction, connection, async () => {
            await mutationQuery(true, () => {
                return controllerRepository.remove(controllerEntity)
            })
            
            await mutationQuery(true, () => {
                return metadataRepository.remove(controllerEntity.metadata)
            })

            /**
             * Попытаться удалить метод контроллера, если он не используется
             */
            try {
                await this.methodService.removeMethod(controllerEntity.method, true)
            } catch(error) {
                block: {
                    if (error instanceof MethodUsedError) {
                        break block
                    }

                    throw error
                }
            }
        })
    }

}