import { getContainer } from '../../../../inversify.config'
import { IPermissionService } from './permission.interface'
import { USER_SYMBOL } from '../user.types'
import { PermissionDoesNotExist, PermissionAlreadyExists } from './permission.errors'
import { RevisionNumberError } from '../../metadata/metadata.errors'
import { Metadata } from '../../entities/metadata.entity'
import { Connection } from 'typeorm'
import { TYPEORM_SYMBOL } from '../../../../core/typeorm/typeorm.types'
import { CREATOR_SYMBOL, CreatorType, ResourceType } from '../../creator/creator.types'
import { ICreatorService } from '../../creator/creator.interface'
import { Permission } from '../../entities/user.entity'
import { PermissionEventMutation } from './permission.types'

beforeAll(async () => {
    const container = await getContainer()
    container.snapshot()
})

afterAll(async () => {
    const container = await getContainer()
    container.restore()
})

describe('PermissionService в UserModule', () => {

    it(`
        Полномочие корректно создаётся. Попытка создать уже существующее полномочие
        приводит к исключению
    `, async () => {
        const container = await getContainer()
        container.snapshot()

        const permissionService = container
            .get<IPermissionService>(USER_SYMBOL.PermissionService)
        const creatorService = container
            .get<ICreatorService>(CREATOR_SYMBOL.CreatorService)

        const eventMutationFn = jest.fn()
        permissionService.onMutation(eventMutationFn)

        await expect(permissionService.isExists('permission1')).resolves.toBe(false)
        await expect(permissionService.create({
            name: 'permission1',
            creator: {
                type: CreatorType.System
            }
        })).resolves.toBeUndefined()
        await expect(permissionService.create({
            name: 'permission1',
            creator: {
                type: CreatorType.System
            }
        })).rejects.toBeInstanceOf(PermissionAlreadyExists)
        await expect(permissionService.isExists('permission1')).resolves.toBe(true)
        await expect(creatorService.isResourceCreator({
            type: ResourceType.Permission,
            id: 1
        }, { type: CreatorType.System }))

        expect(eventMutationFn).toBeCalledTimes(1)
        expect(eventMutationFn).nthCalledWith(1, {
            type: PermissionEventMutation.Create,
            permissionName: 'permission1'
        })

        container.restore()
    })
    
    it(`
        Полномочие корректно удаляется вместе с его метаданными. Попытка удалить несуществующее 
        полномочие ни к чему не приводит
    `, async () => {
        const container = await getContainer()
        container.snapshot()

        const connection = await container
            .get<Promise<Connection>>(TYPEORM_SYMBOL.TypeOrmConnectionApp)
        const metadataRepository = connection.getRepository(Metadata)
        const permissionService = container
            .get<IPermissionService>(USER_SYMBOL.PermissionService)

        const eventMutationFn = jest.fn()
        permissionService.onMutation(eventMutationFn)

        await expect(permissionService.create({
            name: 'permission1',
            creator: {
                type: CreatorType.System
            }
        })).resolves.toBeUndefined()
        await expect(permissionService.isExists('permission1')).resolves.toBe(true)
        await expect(permissionService.remove('permission1')).resolves.toBeUndefined()
        await expect(permissionService.remove('permission1')).resolves.toBeUndefined()
        await expect(permissionService.isExists('permission1')).resolves.toBe(false)
        await expect(metadataRepository.find()).resolves.toHaveLength(0)

        expect(eventMutationFn).toBeCalledTimes(2)
        expect(eventMutationFn).nthCalledWith(2, {
            type: PermissionEventMutation.Remove,
            permissionName: 'permission1'
        })

        container.restore()
    })
    
    it(`
        Попытка установить метаданные в несуществующее полномочие приводит к исключению
    `, async () => {
        const container = await getContainer()
        container.snapshot()

        const permissionService = container
            .get<IPermissionService>(USER_SYMBOL.PermissionService)

        const eventMutationFn = jest.fn()
        permissionService.onMutation(eventMutationFn)
        
        await expect(permissionService.setMetadata('permission1', {
            metadata: {
                custom: null
            },
            revisionNumber: 0
        })).rejects.toBeInstanceOf(PermissionDoesNotExist)

        expect(eventMutationFn).toBeCalledTimes(0)

        container.restore()
    })
    
    it(`
        Метаданные корректно устанавливаются в полномочие и читаются из него. Попытка установить 
        метаданные несоответствующей редакции приводит к исключению
    `, async () => {
        const container = await getContainer()
        container.snapshot()
        
        const permissionService = container
            .get<IPermissionService>(USER_SYMBOL.PermissionService)
        const connection = await container
            .get<Promise<Connection>>(TYPEORM_SYMBOL.TypeOrmConnectionApp)
        const permissionRepository = connection.getRepository(Permission)

        const eventMutationFn = jest.fn()
        permissionService.onMutation(eventMutationFn)

        await expect(permissionService.create({
            name: 'permission1',
            creator: {
                type: CreatorType.System
            }
        })).resolves.toBeUndefined()
        await expect((async () => {
            const permissionEntity = await permissionRepository.findOne({
                where: {
                    name: 'permission1'
                }
            })
            return permissionEntity?.metadata
        })()).resolves.toMatchObject({
            metadata: {
                custom: null
            },
            revisionNumber: 0
        })
        await expect(permissionService.setMetadata('permission1', {
            metadata: {
                custom: {
                    test: 'test'
                }
            },
            revisionNumber: 0
        })).resolves.toBeUndefined()
        await expect((async () => {
            const permissionEntity = await permissionRepository.findOne({
                where: {
                    name: 'permission1'
                }
            })
            return permissionEntity?.metadata
        })()).resolves.toMatchObject({
            metadata: {
                custom: {
                    test: 'test'
                }
            },
            revisionNumber: 1
        })
        await expect(permissionService.setMetadata('permission1', {
            metadata: {
                custom: null
            },
            revisionNumber: 0
        })).rejects.toBeInstanceOf(RevisionNumberError)
        await expect((async () => {
            const permissionEntity = await permissionRepository.findOne({
                where: {
                    name: 'permission1'
                }
            })
            return permissionEntity?.metadata
        })()).resolves.toMatchObject({
            metadata: {
                custom: {
                    test: 'test'
                }
            },
            revisionNumber: 1
        })

        expect(eventMutationFn).toBeCalledTimes(2)
        expect(eventMutationFn).nthCalledWith(2, {
            type: PermissionEventMutation.SetMetadata,
            permissionName: 'permission1'
        })

        container.restore()
    })

})
