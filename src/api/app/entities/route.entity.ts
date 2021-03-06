import { injectable } from 'inversify'
import {
    PrimaryGeneratedColumn,
    CreateDateColumn,
    Entity,
    JoinColumn,
    OneToOne,
    Column,
    PrimaryColumn,
    ManyToOne,
    JoinTable,
    ManyToMany,
    Unique
} from 'typeorm'
import { Metadata } from './metadata.entity'
import { 
    RouteMetadata, 
    HttpMethod, 
    RouteControllerMetadata,
    RouteMiddlewareMetadata
} from '../route/route.types'
import { MiddlewareGroupMetadata, MiddlewareGroupMiddlewareMetadata } from '../route/middleware-group/middleware-group.types'
import { Method } from './method.entity'
import { ControllerMetadata } from '../route/controller/controller.types'
import { MiddlewareMetadata } from '../route/middleware/middleware.types'

@injectable()
@Entity()
@Unique(['namespace', 'name'])
@Unique(['method', 'path'])
export class Route {

    @PrimaryGeneratedColumn()
    id: number

    @CreateDateColumn()
    createdAt: Date

    @OneToOne(() => Metadata, {
        onDelete: 'RESTRICT',
        eager: true,
        cascade: ['insert'],
        nullable: false
    })
    @JoinColumn()
    metadata: Metadata<RouteMetadata>

    @Column({
        nullable: false
    })
    namespace: string

    @Column({
        nullable: false
    })
    name: string

    @Column({
        nullable: false
    })
    method: HttpMethod

    @Column({
        nullable: false
    })
    path: string

    /**
     * Флаг указывающий на то, что роут должен проверять csrf токен
     */
    @Column({
        nullable: false
    })
    isCsrf: boolean

    @ManyToMany(() => MiddlewareGroup)
    @JoinTable({
        name: 'route_middleware_group'
    })
    middlewareGroups: MiddlewareGroup[]

    @JoinTable({
        name: 'route_middleware',
        joinColumn: {
            name: 'routeId',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'middlewareId',
            referencedColumnName: 'id'
        }
    })
    middlewares: Middleware[]

    @OneToOne(() => Metadata, {
        onDelete: 'RESTRICT',
        eager: true,
        cascade: ['insert'],
        nullable: false
    })
    @JoinColumn()
    controllerMetadata: Metadata<RouteControllerMetadata>

    @OneToOne(() => Controller, {
        onDelete: 'RESTRICT',
        nullable: true
    })
    @JoinColumn()
    controller: Controller | null

    @Column({
        nullable: true
    })
    controllerId: number | null

}

@injectable()
@Entity()
@Unique(['namespace', 'name'])
export class Middleware {

    @PrimaryGeneratedColumn()
    id: number

    @CreateDateColumn()
    createdAt: Date

    @Column({
        nullable: false
    })
    namespace: string

    @Column({
        nullable: false
    })
    name: string

    /**
     * Флаг указывающий на то, что все роуты, которым соотвествует промежуточное
     * ПО должны проверять CSRF токен
     */
    @Column({
        nullable: false
    })
    isCsrf: boolean

    @OneToOne(() => Metadata, {
        onDelete: 'RESTRICT',
        eager: true,
        cascade: ['insert'],
        nullable: false
    })
    @JoinColumn()
    metadata: Metadata<MiddlewareMetadata>

    @ManyToOne(() => Method, {
        onDelete: 'RESTRICT',
        nullable: false
    })
    method: Method

}

@injectable()
@Entity()
@Unique(['namespace', 'name'])
export class MiddlewareGroup {

    @PrimaryGeneratedColumn()
    id: number

    @CreateDateColumn()
    createdAt: Date

    @Column({
        nullable: false
    })
    namespace: string

    @Column({
        nullable: false
    })
    name: string

    /**
     * Флаг указывающий на то, что группа промежуточного ПО является глобальной
     * для всех роутов
     */
    @Column({
        nullable: false
    })
    isDefault: boolean

    /**
     * Флаг указывающий на то, что все роуты в данной группе промежуточного ПО должны
     * проверять csrf токен
     */
    @Column({
        nullable: false
    })
    isCsrf: boolean

    @OneToOne(() => Metadata, {
        onDelete: 'RESTRICT',
        eager: true,
        cascade: ['insert'],
        nullable: false
    })
    @JoinColumn()
    metadata: Metadata<MiddlewareGroupMetadata>

    @JoinTable({
        name: 'middleware_group_middleware',
        joinColumn: {
            name: 'middlewareGroupId',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'middlewareId',
            referencedColumnName: 'id'
        }
    })
    middlewares: Middleware[]

}

@injectable()
@Entity()
@Unique(['namespace', 'name'])
export class Controller {

    @PrimaryGeneratedColumn()
    id: number

    @CreateDateColumn()
    createdAt: Date

    @Column({
        nullable: false
    })
    namespace: string

    @Column({
        nullable: false
    })
    name: string

    @OneToOne(() => Metadata, {
        onDelete: 'RESTRICT',
        eager: true,
        cascade: ['insert'],
        nullable: false
    })
    @JoinColumn()
    metadata: Metadata<ControllerMetadata>

    @ManyToOne(() => Method, {
        onDelete: 'RESTRICT',
        nullable: false
    })
    method: Method

}

@injectable()
@Entity('route_middleware_group')
export class RouteMiddlewareGroup {

    @PrimaryColumn()
    routeId: number

    @PrimaryColumn()
    middlewareGroupId: number

    @ManyToOne(() => Route, {
        onDelete: 'CASCADE'
    })
    @JoinColumn()
    route: Route

    @ManyToOne(() => MiddlewareGroup, {
        onDelete: 'CASCADE'
    })
    @JoinColumn()
    middlewareGroup: MiddlewareGroup

    @Column({
        nullable: true
    })
    serialNumber: number

}

@injectable()
@Entity('route_middleware')
@Unique(['routeId', 'middlewareId'])
export class RouteMiddleware {

    @PrimaryGeneratedColumn()
    id: number

    @Column({
        nullable: false
    })
    routeId: number

    @Column({
        nullable: false
    })
    middlewareId: number

    @ManyToOne(() => Route, {
        onDelete: 'CASCADE'
    })
    @JoinColumn()
    route: Route

    @ManyToOne(() => Middleware, {
        onDelete: 'CASCADE'
    })
    @JoinColumn()
    middleware: Middleware

    @Column({
        nullable: true
    })
    serialNumber: number

    @OneToOne(() => Metadata, {
        onDelete: 'RESTRICT',
        eager: true,
        cascade: ['insert'],
        nullable: false
    })
    @JoinColumn()
    metadata: Metadata<RouteMiddlewareMetadata>

    @Column({
        nullable: false
    })
    metadataId: number

}

@injectable()
@Entity('middleware_group_middleware')
@Unique(['middlewareId', 'middlewareGroupId'])
export class MiddlewareGroupMiddleware {

    @PrimaryGeneratedColumn()
    id: number

    @Column({
        nullable: false
    })
    middlewareId: number

    @Column({
        nullable: false
    })
    middlewareGroupId: number

    @ManyToOne(() => Middleware, {
        onDelete: 'CASCADE'
    })
    @JoinColumn()
    middleware: Middleware

    @ManyToOne(() => MiddlewareGroup, {
        onDelete: 'CASCADE'
    })
    @JoinColumn()
    middlewareGroup: MiddlewareGroup

    @Column({
        nullable: true
    })
    serialNumber: number

    @OneToOne(() => Metadata, {
        onDelete: 'RESTRICT',
        eager: true,
        cascade: ['insert'],
        nullable: false
    })
    @JoinColumn()
    metadata: Metadata<MiddlewareGroupMiddlewareMetadata>

    @Column({
        nullable: false
    })
    metadataId: number

}