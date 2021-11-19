import { getContainer } from '../../../inversify.config'
import { 
    CREATOR_SYMBOL, 
    ResourceType,
    CreatorType
} from './creator.types'
import { ICreatorService } from './creator.interface'
import { TYPEORM_SYMBOL } from '../../../core/typeorm/typeorm.types'
import { Connection } from 'typeorm'
import { Method } from '../entities/method.entity'
import { BlockInstance } from '../entities/block-instance.entity'
import { BlockVersion } from '../entities/block-version.entity'
import { Creator } from '../entities/creator.entity'
import { ResourceAlreadyHasCreator } from './creator.errors'

beforeAll(async () => {
    const container = await getContainer()
    container.snapshot()
})

afterAll(async () => {
    const container = await getContainer()
    container.restore()
})

describe('CreatorService в CreatorModule', () => {

    describe('Методы в качестве ресурсов', () => {

        it(`
            Методы корректно привязываются к экземпляру блока. Нельзя удалить
            экземпляр блока с привязанным методом, но можно удалить метод.
        `, async () => {
            const container = await getContainer()
            container.snapshot()
    
            const creatorService = container
                .get<ICreatorService>(CREATOR_SYMBOL.CreatorService)
            const connection = await container
                .get<Promise<Connection>>(TYPEORM_SYMBOL.TypeOrmConnectionApp)
            const methodRepository = connection.getRepository(Method)
            const versionRepository = connection.getRepository(BlockVersion)
            const instanceRepository = connection.getRepository(BlockInstance)
            const creatorRepository = connection.getRepository(Creator)
    
            const versionEntity = await versionRepository.save({
                name: 'name',
                path: 'path',
                version: 'version' 
            })
            const instanceEntity = await instanceRepository.save({
                blockVersion: versionEntity
            })
            const methodEntity = await methodRepository.save({
                name: 'name',
                namespace: 'namespace',
                type: 'type'
            })
    
            await expect(creatorService.bind({
                type: ResourceType.Method,
                id: methodEntity.id
            }, {
                type: CreatorType.BlockInstance,
                id: instanceEntity.id
            })).resolves.toBeUndefined()
            await expect(creatorRepository.find())
                .resolves
                .toHaveLength(1)
            await expect(instanceRepository.delete(instanceEntity))
                .rejects
                .toThrow()
            await expect(methodRepository.delete(methodEntity))
                .resolves
                .toBeDefined()
            await expect(creatorRepository.find())
                .resolves
                .toHaveLength(0)
    
            container.restore()
        })
    
        it(`
            Методы корректно привязываются к системе. Привязка удаляется вместе
            с удалением метода
        `, async () => {
            const container = await getContainer()
            container.snapshot()
    
            const creatorService = container
                .get<ICreatorService>(CREATOR_SYMBOL.CreatorService)
            const connection = await container
                .get<Promise<Connection>>(TYPEORM_SYMBOL.TypeOrmConnectionApp)
            const methodRepository = connection.getRepository(Method)
            const creatorRepository = connection.getRepository(Creator)
    
            const methodEntity = await methodRepository.save({
                name: 'name',
                namespace: 'namespace',
                type: 'type'
            })
    
            await expect(creatorService.bind({
                type: ResourceType.Method,
                id: methodEntity.id
            }, {
                type: CreatorType.System
            })).resolves.toBeUndefined()
            await expect(creatorRepository.find())
                .resolves
                .toHaveLength(1)
            await expect(methodRepository.delete(methodEntity))
                .resolves
                .toBeDefined()
            await expect(creatorRepository.find())
                .resolves
                .toHaveLength(0)
    
            container.restore()
        })
    
        it(`
            Экземпляр блока, к которому привязан метод корректно можно получить
        `, async () => {
            const container = await getContainer()
            container.snapshot()

            const creatorService = container
                .get<ICreatorService>(CREATOR_SYMBOL.CreatorService)
            const connection = await container
                .get<Promise<Connection>>(TYPEORM_SYMBOL.TypeOrmConnectionApp)
            const methodRepository = connection.getRepository(Method)
            const versionRepository = connection.getRepository(BlockVersion)
            const instanceRepository = connection.getRepository(BlockInstance)
    
            const versionEntity = await versionRepository.save({
                name: 'name',
                path: 'path',
                version: 'version' 
            })
            const instanceEntity = await instanceRepository.save({
                blockVersion: versionEntity
            })
            const methodEntity = await methodRepository.save({
                name: 'name',
                namespace: 'namespace',
                type: 'type'
            })

            await creatorService.bind({
                type: ResourceType.Method,
                id: methodEntity.id
            }, {
                type: CreatorType.BlockInstance,
                id: instanceEntity.id
            })

            await expect(creatorService.getCreator({
                type: ResourceType.Method,
                id: methodEntity.id
            })).resolves.toBeInstanceOf(BlockInstance)

            container.restore()
        })
    
        it(`
            Систему, к которой привязан метод корректно можно получить 
        `, async () => {
            const container = await getContainer()
            container.snapshot()

            const creatorService = container
                .get<ICreatorService>(CREATOR_SYMBOL.CreatorService)
            const connection = await container
                .get<Promise<Connection>>(TYPEORM_SYMBOL.TypeOrmConnectionApp)
            const methodRepository = connection.getRepository(Method)

            const methodEntity = await methodRepository.save({
                name: 'name',
                namespace: 'namespace',
                type: 'type'
            })

            await creatorService.bind({
                type: ResourceType.Method,
                id: methodEntity.id
            }, {
                type: CreatorType.System
            })

            await expect(creatorService.getCreator({
                type: ResourceType.Method,
                id: methodEntity.id
            })).resolves.toBe(CreatorType.System)

            container.restore()
        })

    })

    it(`
        Попытка привязать создателя к ресурсу у которого уже есть создатель выбрасывает
        исключение
    `, async () => {
        const container = await getContainer()
        container.snapshot()

        const creatorService = container
            .get<ICreatorService>(CREATOR_SYMBOL.CreatorService)
        const connection = await container
            .get<Promise<Connection>>(TYPEORM_SYMBOL.TypeOrmConnectionApp)
        const methodRepository = connection.getRepository(Method)

        const methodEntity = await methodRepository.save({
            name: 'name',
            namespace: 'namespace',
            type: 'type'
        })

        await expect(creatorService.bind({
            type: ResourceType.Method,
            id: methodEntity.id
        }, {
            type: CreatorType.System
        })).resolves.toBeUndefined()
        await expect(creatorService.bind({
            type: ResourceType.Method,
            id: methodEntity.id
        }, {
            type: CreatorType.System
        })).rejects.toBeInstanceOf(ResourceAlreadyHasCreator)

        container.restore()
    })

    it(`
        Попытка получить создателя ресурса, к которому не привязано ни одного создателя
        возвращает undefined
    `, async () => {
        const container = await getContainer()
        container.snapshot()

        const creatorService = container
            .get<ICreatorService>(CREATOR_SYMBOL.CreatorService)

        await expect(creatorService.getCreator({
            type: ResourceType.Method,
            id: 1
        })).resolves.toBeUndefined()

        container.restore()
    })

    it(`
        Владение системы ресурсом корректно подтверждается
    `, async () => {
        const container = await getContainer()
        container.snapshot()

        const creatorService = container
            .get<ICreatorService>(CREATOR_SYMBOL.CreatorService)
        const connection = await container
            .get<Promise<Connection>>(TYPEORM_SYMBOL.TypeOrmConnectionApp)
        const methodRepository = connection.getRepository(Method)

        const methodEntity = await methodRepository.save({
            name: 'name',
            namespace: 'namespace',
            type: 'type'
        })

        await creatorService.bind({
            type: ResourceType.Method,
            id: methodEntity.id
        }, {
            type: CreatorType.System
        })

        await expect(creatorService.isResourceCreator({
            type: ResourceType.Method,
            id: methodEntity.id
        }, {
            type: CreatorType.System
        })).resolves.toBe(true)

        container.restore()
    })

    it(`
        Отсутствие создателя у ресурса возвращает false при проверке владения ресурсом
    `, async () => {
        const container = await getContainer()
        container.snapshot()

        const creatorService = container
            .get<ICreatorService>(CREATOR_SYMBOL.CreatorService)

        await expect(creatorService.isResourceCreator({
            type: ResourceType.Method,
            id: 0
        }, {
            type: CreatorType.System
        })).resolves.toBe(false)

        container.restore()
    })

    it(`
        Владение экземпляра блока ресурсом корректно подтверждается
    `, async () => {
        const container = await getContainer()
        container.snapshot()

        const creatorService = container
            .get<ICreatorService>(CREATOR_SYMBOL.CreatorService)
        const connection = await container
            .get<Promise<Connection>>(TYPEORM_SYMBOL.TypeOrmConnectionApp)
        const methodRepository = connection.getRepository(Method)
        const versionRepository = connection.getRepository(BlockVersion)
        const instanceRepository = connection.getRepository(BlockInstance)

        const versionEntity = await versionRepository.save({
            name: 'name',
            path: 'path',
            version: 'version' 
        })
        const instanceEntity = await instanceRepository.save({
            blockVersion: versionEntity
        })

        const methodEntity = await methodRepository.save({
            name: 'name',
            namespace: 'namespace',
            type: 'type'
        })

        await creatorService.bind({
            type: ResourceType.Method,
            id: methodEntity.id
        }, {
            type: CreatorType.BlockInstance,
            id: instanceEntity.id
        })

        await expect(creatorService.isResourceCreator({
            type: ResourceType.Method,
            id: methodEntity.id
        }, {
            type: CreatorType.BlockInstance,
            id: instanceEntity.id
        })).resolves.toBe(true)
        await expect(creatorService.isResourceCreator({
            type: ResourceType.Method,
            id: methodEntity.id
        }, {
            type: CreatorType.BlockInstance,
            id: 0
        })).resolves.toBe(false)

        container.restore()
    })

})