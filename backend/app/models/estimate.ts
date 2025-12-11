import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'

import Activity from '#models/activity'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Project from './project.js'
import Resource from '#models/resource'

export default class Estimate extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare projectId: number

  @column()
  declare resourceId: number

  @column()
  declare activityId: number

  @column()
  declare mandays: number

  @column()
  declare rate: number | null

  @column.date()
  declare startDate: DateTime

  @column.dateTime({ autoCreate: true, serializeAs: null })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  declare updatedAt: DateTime

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>

  @belongsTo(() => Activity)
  declare activity: BelongsTo<typeof Activity>

  @belongsTo(() => Resource)
  declare resource: BelongsTo<typeof Resource>
}
