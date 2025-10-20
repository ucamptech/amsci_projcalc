import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'

import Estimate from '#models/estimate'

export default class Project extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare sponsor: string

  @column()
  declare manager: string

  @column()
  declare businessNeed: string

  @column()
  declare projectGoal: string

  @column()
  declare measurableObjectives: string

  @column()
  declare deliverables: string

  @column()
  declare outOfScope: string

  @hasMany(() => Estimate)
  declare estimates: HasMany<typeof Estimate>

  @column.dateTime({ autoCreate: true, serializeAs: null })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  declare updatedAt: DateTime
}
