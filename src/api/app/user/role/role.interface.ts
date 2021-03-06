import { SnapshotMetadata } from '../../metadata/metadata.types'
import { RoleMetadata, RolePermissionMetadata, CreateRole, EventContext } from './role.types'

export interface IRoleService {

    /**
     * Создать новую роль
     */
    create(options: CreateRole, nestedTransaction?: boolean): Promise<void>

    /**
     * Удалить указанную роль
     */
    remove(role: string, nestedTransaction?: boolean): Promise<void>

    /**
     * Проверить существование роли
     */
    isExists(role: string): Promise<boolean>

    /**
     * Добавить к роли указанные полномочия
     */
    addPermission(role: string, permission: string, nestedTransaction?: boolean): Promise<void>

    /**
     * Удалить из роли указанные полномочия
     */
    removePermission(role: string, permission: string, nestedTransaction?: boolean): Promise<void>

    /**
     * Проверить наличие полномочия в роли
     */
    isExistsPermission(role: string, permission: string): Promise<boolean>

    /**
     * Изменить метаданные в связи указанной роли с указанным полномочием, если она
     * существует
     */
    setRolePermissionMetadata(
        role: string, 
        permission: string, 
        snapshotMetadata: SnapshotMetadata<RolePermissionMetadata>, 
        nestedTransaction?: boolean
    ): Promise<void>

    /**
     * Установить метаданные в роль, если она существует
     */
    setMetadata(role: string, snapshotMetadata: SnapshotMetadata<RoleMetadata>, nestedTransaction?: boolean): Promise<void>

    /**
     * Поставить обработчик для прослушивания события мутации ролей
     */
    onMutation(handler: (context: EventContext) => void): void

}