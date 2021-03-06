import { 
    ScriptID, 
    ScriptRun, 
    ScriptInfo, 
    ScriptActivityInfo,
    ReadyAPIPropertyStats 
} from './vm.types'
import { ScriptError } from './vm.errors'

export interface IVMService {
    
    /**
     * Запуск указанного скрипта
     */
    run(params: ScriptRun): Promise<ScriptID>

    /**
     * Список всех ранее запущенных скриптов
     */
    listScripts(): ScriptID[]

    /**
     * Полностью завершить выполнение скрипта, если он еще ее не завершил
     * (с полной очисткой ссылок на него), а после полностью удалить его
     * из памяти
     */
    remove(scriptId: ScriptID): void

    /**
     * Получить информацию о скрипте, если он ещё не был удален.
     */
    info(scriptId: ScriptID): ScriptInfo | undefined

    /**
     * Получить статистику по всем свойствам указанного скрипта.
     */
    stats(scriptId: ScriptID): Promise<ReadyAPIPropertyStats[] | undefined>

    /**
     * Подписаться на событие конкретного скрипта. Стоит помнить, что с событиями
     * следует обращаться очень аккуратно. Например, событие активности срабатывает
     * в промисе и из-за этого могут возникнуть нежелательные побочные эффекты, если
     * предполагать, что на момент срабатывания события скрипт еще существует
     */
    on(scriptId: ScriptID, event: symbol, handler: (error: ScriptError) => void): void
    on(scriptId: ScriptID, event: symbol, handler: (info: ScriptActivityInfo) => void): void
    on(scriptId: ScriptID, event: symbol, handler: () => void): void

    /**
     * Сгенерировать ошибку для указанного скрипта
     */
    error(scriptId: ScriptID, error: any): void

}