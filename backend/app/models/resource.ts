import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import Estimate from './estimate.js'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import ResourceType from '#models/resource_type'

export default class Resource extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare title: string

  @column()
  declare type: string

  @column()
  declare cost: number

  @column()
  declare resourceTypeId: number

  @column.dateTime({ autoCreate: true, serializeAs: null })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  declare updatedAt: DateTime

  @hasMany(() => Estimate)
  declare estimates: HasMany<typeof Estimate>

  @belongsTo(() => ResourceType)
  declare resourceType: BelongsTo<typeof ResourceType>
}
