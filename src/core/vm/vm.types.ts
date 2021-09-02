import { TargetApiProperty } from './api-property/api-property.types'
import { IAPIPropertyFactory } from './api-property/api-property.interface'
import { ScriptError } from './vm.errors'
import { APIProperty, APIPropertyStats, APIPropertyStatsReducer } from './api-property/api-property.classes'
import { EventEmitter } from 'events'

export const VM_SYMBOL = {
    VMService: Symbol('VMService'),
    VMConfig: Symbol('VMConfig'),
    APIPropertyFactoryV1: Symbol('APIPropertyFactoryV1')
}

export const ScriptEvent = {
    /**
     * Скрипт завершил свою работу (неизвестно с ошибкой или нет). Запускается 
     * событие перед событием error, если скрипт завершился в результате ошибки. 
     * Может произвольно завершиться после того, как все api свойства освободят 
     * ссылки на структуры пользовательского скрипта. Срабатывает после события
     * error, если скрипт завершился в результате ошибки
     */
    stop: Symbol('stop'),

    /**
     * Скрипт завершил свою работу в результате ошибки, которая передаётся в
     * событие. Срабатывает гарантировано раньше события stop
     */
    error: Symbol('error'),

    /**
     * В скрипте или в каком либо из свойств сработало какое-либо событие.
     * Даёт знать о том, что в целом что-то произошло
     */
    activity: Symbol('activity')
}

export type ScriptRun = {
    /**
     * Путь к файлу, который должен быть запущен
     */
    readonly path: string

    /**
     * Номинальное название скрипта, чтобы его мог идентифицировать пользователь.
     * Путь для этого не подходит. Возможно, зачастую это будет путь к git
     * репозиторию
     */
    readonly name: string

    /**
     * Путь к каталогу файлы внутри которого могут быть импортированы
     * в запущенном скрипте
     */
    readonly rootDir: string

    /**
     * Список названий зарегистрированных глобальных свойств, которые
     * должны быть доступны в запущенном скрипте
     */
    readonly apiProperties: string[]
}

export type ScriptInfo = {
    /**
     * Параметры с которыми был запущен скрипт
     */
    params: ScriptRun

    /**
     * Дата запуска скрипта
     */
    dateStart: Date

    /**
     * Дата завершения работы скрипта
     */
    dateEnd?: Date

    /**
     * Ошибки скрипта
     */
    errors: ScriptError[]
}

export type ScriptActivityInfo = {
    /**
     * Событие, которое спровоцировало активность
     */
    event: Symbol

    /**
     * Если событие произошло в api свойстве, то указать его название и версию
     */
    apiProperty?: TargetApiProperty

    /**
     * Параметры, которые были пареданы в сработанное событие
     */
    params?: Object
}

export type ScriptID = symbol

export type VMConfig = {
    /**
     * Максимальное количество остановленных скриптов, информация о которых
     * будет продолжать храниться в памяти до явного удаления. По достижении
     * лимита информация о старых скриптах будет вытесняться.
     */
    maxStoppedScripts: number

    /**
     * Максимальное количество сегментов статистики по одному api свойству. По достижении
     * лимита наиболее старые сегменты вытесняются
     */
    maxStatsSegments: number

    /**
     * Максимальное количество экземпляров ошибок, которые могут храниться в контексте
     * одного скрипта. По достижении лимита информация о старых ошибках будет вытесняться
     */
    maxScriptErrors: number

    /**
     *  Пространство имён для api свойств
     */
    namespace: string

    /**
     * Все фабрики api свойств всех версий. Очень важен порядок массива. Вначале должны
     * обязательно быть самые ранние версии
     */
    api: API[]
}

export type API = {
    /**
     * Версия api
     */
    version: string
    
    /**
     * Список фабрик всех свойств api. Фабрики являются singleton,
     * это стоит учитывать
     */
    properties: IAPIPropertyFactory[]
}

export type APIPropertyMetadata = {
    /**
     * Используемая фабрика
     */
    factory: IAPIPropertyFactory

    /**
     * Сегменты статистики
     */
    segmentsStats: APIPropertyStats[]

    /**
     * Экземпляр класса свойства
     */
    property: APIProperty
}

export type APIMetadata = {
    /**
     * Версия api
     */
    version: string

    /**
     * Необходимые методанные по всем используемым свойствам
     */
    properties: APIPropertyMetadata[]
}

export type ScriptMetadata = {
    /**
     * Используемое скриптом api. Как и в конфигурации, порядок очень важен
     */
    api: APIMetadata[]

    /**
     * Информация о скрипте
     */
    info: ScriptInfo

    /**
     * Используемый для скрипта генератор событий
     */
    eventEmitter: EventEmitter
}

export type ReadyAPIPropertyStats = {
    /**
     * Название API версии
     */
    version: string

    /**
     * Название API свойства
     */
    name: string

    /**
     * Готовая статистика по свойству
     */
    stats: APIPropertyStatsReducer
}