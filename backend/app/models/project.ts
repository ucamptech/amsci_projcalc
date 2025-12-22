import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'

import { DateTime } from 'luxon'
import Estimate from '#models/estimate'
import type { HasMany } from '@adonisjs/lucid/types/relations'

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
  declare version: string

  @column.date()
  declare startDate: DateTime

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

  @column()
  declare pmRate: number | null

  @column()
  declare pmMandays: number | null

  @column()
  declare projectUid: string | null

  @column()
  declare isCurrent: boolean

  @hasMany(() => Estimate)
  declare estimates: HasMany<typeof Estimate>

  @column.dateTime({ autoCreate: true, serializeAs: null })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, serializeAs: null })
  declare updatedAt: DateTime
}
