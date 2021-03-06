import { EntityRepository, AbstractRepository } from 'typeorm'
import { Signal, SignalGraph } from '../../entities/signal.entity'
import { CyclicSignalsNotAllowed } from '../signal.errors'
import { mutationQuery } from '../../../../core/typeorm/utils/mutation-query'

@EntityRepository(Signal)
export class GraphRepository extends AbstractRepository<Signal> {

    public async connect(outSignal: Signal, inSignal: Signal, nestedTransaction = false): Promise<void> {
        const manager = this.manager

        const row = await mutationQuery(nestedTransaction, () => {
            return manager.query(`
                WITH RECURSIVE 
                    nodes(outSignalId, inSignalId) AS (
                        SELECT s.outSignalId, s.inSignalId FROM signal_graph s WHERE s.outSignalId=${inSignal.id}
                        UNION
                        SELECT s.outSignalId, s.inSignalId FROM signal_graph s JOIN nodes n ON s.outSignalId=n.inSignalId
                    )
                INSERT INTO signal_graph (outSignalId, inSignalId) 
                SELECT ${outSignal.id}, ${inSignal.id}
                WHERE NOT EXISTS(SELECT * FROM nodes WHERE inSignalId=${outSignal.id})
                AND NOT EXISTS(SELECT 'true' WHERE ${outSignal.id}=${inSignal.id})
                RETURNING *
            `)
        })

        if (row.length === 0) {
            throw new CyclicSignalsNotAllowed
        }
    }

    /**
     * Отсоединяет друг от друга указанные сигналы и возвращает флаг, указывающий на то, были ли
     * изначально эти сигналы соединены
     */
    public async unconnect(outSignal: Signal, inSignal: Signal, nestedTransaction = false): Promise<boolean> {
        const signalGraphRepository = this.manager.getRepository(SignalGraph)

        const deleteResult = await mutationQuery(nestedTransaction, () => {
            return signalGraphRepository.delete({
                outSignalId: outSignal.id,
                inSignalId: inSignal.id
            })
        })

        return deleteResult.affected === 0 ? false : true
    }

}