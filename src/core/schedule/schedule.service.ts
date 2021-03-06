import { injectable } from 'inversify'
import { IScheduleService } from './schedule.interface'
import { Recurrence, JobHandler, JobStats } from './schedule.types'
import { IncorrectRecurrence } from './schedule.errors'
import nodeSchedule from 'node-schedule'
import { getScheduleLogger } from '../../utils/logger'
import { getLoggerErrorFormat } from '../../utils/error-format'

@injectable()
export class ScheduleService implements IScheduleService {

    private jobs: Map<
        Symbol, { job: nodeSchedule.Job, stats: JobStats }
    > = new Map

    private eventRun(name: Symbol) {
        const job = this.jobs.get(name)

        if (!job) {
            return
        }

        job.stats.run++

        if (!job.job.nextInvocation()) {
            this.remove(name)
        }
    }

    private eventError(name: Symbol, error: any) {
        const job = this.jobs.get(name)
        
        if (!job) {
            return
        }

        job.stats.error++

        if (!job.job.nextInvocation()) {
            this.remove(name)
        }
        
        getScheduleLogger().error(getLoggerErrorFormat(error), name.toString())
    }

    public schedule(name: Symbol, recurrence: Recurrence, callback: JobHandler) {
        const job = nodeSchedule.scheduleJob(recurrence, callback)

        if (!job) {
            throw new IncorrectRecurrence()
        }
        
        const stats = {
            error: 0,
            run: 0
        }
        this.jobs.set(name, {job, stats})
        
        job.on('run', () => {
            this.eventRun(name)
        })

        job.on('error', (error) => {
            this.eventError(name, error)
        })
    }

    public remove(name: Symbol) {
        const job = this.jobs.get(name)

        if (!job) {
            return
        }

        job.job.cancel()
        this.jobs.delete(name)
    }

    public invoke(name: Symbol) {
        const job = this.jobs.get(name)

        if (!job) {
            return
        }

        try {
            job.job.invoke()
            this.eventRun(name)
        } catch (error) {
            this.eventError(name, error)
        }
    }

    public has(name: Symbol): boolean {
        const job = this.jobs.get(name)
        return job ? true : false
    }

    public stats(name: Symbol): JobStats | undefined {
        const job = this.jobs.get(name)

        if (!job) {
            return
        }

        return job.stats
    }

}