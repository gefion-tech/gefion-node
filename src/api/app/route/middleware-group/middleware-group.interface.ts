import { 
    CreateMiddlewareGroup, 
    MiddlewareGroupMetadata, 
    MiddlewareGroup,
    EventContext,
    MiddlewareGroupMiddlewareMetadata
} from './middleware-group.types'
import { Middleware } from '../middleware/middleware.types'
import { SnapshotMetadata } from '../../metadata/metadata.types'

export interface IMiddlewareGroupService {

    /**
     * Создать группу промежуточного ПО, если её ещё не существует
     */
    create(options: CreateMiddlewareGroup, nestedTransaction?: boolean): Promise<void>

    /**
     * Проверить существование группы ПО с указанным названием
     */
    isExists(group: MiddlewareGroup): Promise<boolean>

    /**
     * Изменить метаданные указанной группы промежуточного ПО
     */
    setMetadata(group: MiddlewareGroup, snapshotMetadata: SnapshotMetadata<MiddlewareGroupMetadata>, nestedTransaction?: boolean): Promise<void>

    /**
     * Добавить указанное промежуточное ПО в указанную группу, если оно ещё в ней не состоит
     */
    addMiddleware(group: MiddlewareGroup, middleware: Middleware, nestedTransaction?: boolean): Promise<void>

    /**
     * Удалить указанное промежуточное ПО из указанной группы
     */
    removeMiddleware(group: MiddlewareGroup, middleware: Middleware, nestedTransaction?: boolean): Promise<void>

    /**
     * Изменить метаданные связи группы middleware с отдельным middleware
     */
    setMiddlewareGroupMiddlewareMetadata(
        group: MiddlewareGroup,
        middleware: Middleware,
        snapshotMetadata: SnapshotMetadata<MiddlewareGroupMiddlewareMetadata>,
        nestedTransaction?: boolean
    ): Promise<void>

    /**
     * Изменить порядковый номер указанного промежуточного ПО в указанной группе
     */
    setMiddlewareSerialNumber(group: MiddlewareGroup, middleware: Middleware, serialNumber: number, nestedTransaction?: boolean): Promise<void>

    /**
     * Удалить указанную группу промежуточного ПО
     */
    remove(group: MiddlewareGroup, nestedTransaction?: boolean): Promise<void>

    /**
     * Включить флаг csrf в указанной группе промежуточного ПО
     */
    enableCsrf(group: MiddlewareGroup, nestedTransaction?: boolean): Promise<void>

    /**
     * Выключить флаг csrf в указанной группе промежуточного ПО
     */
    disableCsrf(group: MiddlewareGroup, nestedTransaction?: boolean): Promise<void>

    /**
     * Поставить обработчик для прослушивания события мутации группы
     */
    onMutation(handler: (context: EventContext) => void): void

}