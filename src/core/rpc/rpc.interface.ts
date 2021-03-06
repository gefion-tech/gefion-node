import { RPCHandler, RPCResponseHttpType } from './rpc.types'

export interface IRPCService {

    /**
     * Подписаться на вызовы конкретного метода. Может быть только один
     * обработчик метода. Вторая попытка объявить обработчик вызовет исключение.
     * 
     * Все исключения, которые вызываются внутри объявленного метода будут логируются
     * на локальном уровне за исключением исключений с ошибкой ErrorInMethod. Такие
     * ошибки будут напрямую отправлены вызывающему экземпляру
     */
    method(name: string, handler: RPCHandler): void

    /**
     * Вызвать указанный удалённый метод на всех экземплярах приложения за исключением
     * текущего и вернуть массив ответов с каждого экземпляра.
     */
    call<TResult = any, TError = any>(method: string, params: any[]): Promise<RPCResponseHttpType<TResult, TError>[]>

    /**
     * Вызвать указанный метод локально в текущей ноде
     */
    localCall(method: string, params: any[]): Promise<any>
    
}