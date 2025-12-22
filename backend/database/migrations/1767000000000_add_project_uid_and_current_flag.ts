import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'projects'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('project_uid').nullable().index()
      table.boolean('is_current').notNullable().defaultTo(false)
    })

    // Seed existing rows with a uid and set them current after the table is altered
    this.defer(async (db) => {
      try {
        await db.rawQuery(
          `UPDATE projects SET project_uid = COALESCE(project_uid, UUID()), is_current = true WHERE project_uid IS NULL`
        )
      } catch (error) {
        console.warn('Skipping seed of project_uid/is_current', error)
      }
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('project_uid')
      table.dropColumn('is_current')
    })
  }
}
