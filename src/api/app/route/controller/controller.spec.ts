import { getContainer } from '../../../../inversify.config'
import { Controller } from '../../entities/route.entity'
import { Connection } from 'typeorm'
import { IControllerService } from './controller.interface'
import { ROUTE_SYMBOL } from '../route.types'
import {
    ControllerDoesNotExists,
    ControllerMethodNotDefined
} from './controller.errors'
import { CreatorType, CREATOR_SYMBOL, ResourceType } from '../../creator/creator.types'
import { Method } from '../../entities/method.entity'
import { TYPEORM_SYMBOL } from '../../../../core/typeorm/typeorm.types'
import { ICreatorService } from '../../creator/creator.interface'
import { Metadata } from '../../entities/metadata.entity'
import { RevisionNumberError } from '../../metadata/metadata.errors'

beforeAll(async () => {
    const container = await getContainer()
    container.snapshot()
})

afterAll(async () => {
    const container = await getContainer()
    container.restore()
})

describe('ControllerService в RouteModule', () => {

    it(`
        Попытка создать контроллер с несуществующим методом приводит к исключению
    `, async () => {
        const container = await getContainer()
        container.snapshot()

        const controllerService = container
            .get<IControllerService>(ROUTE_SYMBOL.ControllerService)

        await expect(controllerService.createIfNotExists({
            creator: {
                type: CreatorType.System
            },
            name: 'controller1',
            method: {
                name: 'method1',
                type: 'type1',
                namespace: 'namespace1'
            }
        })).rejects.toBeInstanceOf(ControllerMethodNotDefined)

        container.restore()
    })

    it(`
        Контроллер корректно создаётся. Попытка создания уже созданного контроллера
        ни к чему не приводит
    `, async () => {
        const container = await getContainer()
        container.snapshot()

        const controllerService = container
            .get<IControllerService>(ROUTE_SYMBOL.ControllerService)
        const creatorService = container
            .get<ICreatorService>(CREATOR_SYMBOL.CreatorService)
        const connection = await container
            .get<Promise<Connection>>(TYPEORM_SYMBOL.TypeOrmConnectionApp)
        const methodRepository = connection.getRepository(Method)

        const methodEntity = await methodRepository.save({
            name: 'name1',
            type: 'type1',
            namespace: 'namespace1'
        })

        await expect(controllerService.isExists('controller1')).resolves.toBe(false)
        await expect(controllerService.createIfNotExists({
            creator: {
                type: CreatorType.System
            },
            method: methodEntity,
            name: 'controller1'
        })).resolves.toBeUndefined()
        await expect(controllerService.createIfNotExists({
            creator: {
                type: CreatorType.System
            },
            method: methodEntity,
            name: 'controller1'
        })).resolves.toBeUndefined()
        await expect(controllerService.isExists('controller1')).resolves.toBe(true)
        await expect(creatorService.isResourceCreator({
            type: ResourceType.Controller,
            id: 1
        }, {
            type: CreatorType.System
        })).resolves.toBe(true)

        container.restore()
    })

    it(`
        Контроллер корректно удаляется вместе с метаданными. Попытка удалить несуществующий 
        контроллер приводит к исключению. Вместе с контроллером удаляется и его метод, если он
        больше ни к чему не привязан
    `, async () => {
        const container = await getContainer()
        container.snapshot()

        const controllerService = container
            .get<IControllerService>(ROUTE_SYMBOL.ControllerService)
        const creatorService = container
            .get<ICreatorService>(CREATOR_SYMBOL.CreatorService)
        const connection = await container
            .get<Promise<Connection>>(TYPEORM_SYMBOL.TypeOrmConnectionApp)
        const methodRepository = connection.getRepository(Method)
        const metadataRepository = connection.getRepository(Metadata)

        const methodEntity = await methodRepository.save({
            name: 'name1',
            type: 'type1',
            namespace: 'namespace1'
        })
        await controllerService.createIfNotExists({
            creator: {
                type: CreatorType.System
            },
            method: methodEntity,
            name: 'controller1'
        })
        
        await expect(controllerService.isExists('controller1')).resolves.toBe(true)
        await expect(metadataRepository.count()).resolves.toBe(1)
        await expect(methodRepository.count()).resolves.toBe(1)
        await expect(creatorService.isResourceCreator({
            type: ResourceType.Controller,
            id: 1
        }, {
            type: CreatorType.System
        })).resolves.toBe(true)

        await expect(controllerService.remove('controller1')).resolves.toBeUndefined()
        await expect(controllerService.remove('controller1')).resolves.toBeUndefined()
        
        await expect(controllerService.isExists('controller1')).resolves.toBe(false)
        await expect(metadataRepository.count()).resolves.toBe(0)
        await expect(methodRepository.count()).resolves.toBe(0)
        await expect(creatorService.isResourceCreator({
            type: ResourceType.Controller,
            id: 1
        }, {
            type: CreatorType.System
        })).resolves.toBe(false)

        container.restore()
    })

    it(`
        Попытка установить метаданные в несуществующиё контроллер приводит к исключению
    `, async () => {
        const container = await getContainer()
        container.snapshot()

        const controllerService = container
            .get<IControllerService>(ROUTE_SYMBOL.ControllerService)

        await expect(controllerService.setMetadata('controller1', {
            metadata: {
                custom: true
            },
            revisionNumber: 0
        })).rejects.toBeInstanceOf(ControllerDoesNotExists)

        container.restore()
    })

    it(`
        Метаданные корректно устанавливаются в контроллер и читаются из него. Попытка установить 
        метаданные несоответствующей редакции приводит к исключению
    `, async () => {
        const container = await getContainer()
        container.snapshot()

        const controllerService = container
            .get<IControllerService>(ROUTE_SYMBOL.ControllerService)
        const connection = await container
            .get<Promise<Connection>>(TYPEORM_SYMBOL.TypeOrmConnectionApp)
        const metadataRepository = connection.getRepository(Metadata)
        const controllerRepository = connection.getRepository(Controller)
        const methodRepository = connection.getRepository(Method)

        const methodEntity = await methodRepository.save({
            name: 'name1',
            type: 'type1',
            namespace: 'namespace1'
        })

        await expect(controllerService.createIfNotExists({
            creator: {
                type: CreatorType.System
            },
            method: methodEntity,
            name: 'controller1'
        })).resolves.toBeUndefined()
        await expect(metadataRepository.count()).resolves.toBe(1)
        await expect((async () => {
            const controllerEntity = await controllerRepository.findOne({
                where: {
                    name: 'controller1'
                }
            })
            return controllerEntity?.metadata
        })()).resolves.toMatchObject({
            metadata: {
                custom: null
            },
            revisionNumber: 0
        })
        await expect(controllerService.setMetadata('controller1', {
            metadata: {
                custom: {
                    test: 'test'
                }
            },
            revisionNumber: 0
        })).resolves.toBeUndefined()
        await expect((async () => {
            const controllerEntity = await controllerRepository.findOne({
                where: {
                    name: 'controller1'
                }
            })
            return controllerEntity?.metadata
        })()).resolves.toMatchObject({
            metadata: {
                custom: {
                    test: 'test'
                }
            },
            revisionNumber: 1
        })
        await expect(controllerService.setMetadata('controller1', {
            metadata: {
                custom: null
            },
            revisionNumber: 0
        })).rejects.toBeInstanceOf(RevisionNumberError)
        await expect((async () => {
            const controllerEntity = await controllerRepository.findOne({
                where: {
                    name: 'controller1'
                }
            })
            return controllerEntity?.metadata
        })()).resolves.toMatchObject({
            metadata: {
                custom: {
                    test: 'test'
                }
            },
            revisionNumber: 1
        })
        await expect(metadataRepository.count()).resolves.toBe(1)

        container.restore()
    })

})