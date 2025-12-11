import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'

import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'
import Project from './project.js'

export default class Note extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare projectId: number | null

  @column()
  declare title: string

  @column()
  declare body: string

  @column()
  declare tag: string

  @column.dateTime({ autoCreate: true, serializeAs: null })
  declare createdAt: DateTime

  @column.dateTime({
    autoCreate: true,
    autoUpdate: true,
    serializeAs: 'updatedAt',
  })
  declare updatedAt: DateTime

  @belongsTo(() => Project)
  declare project: BelongsTo<typeof Project>
}
