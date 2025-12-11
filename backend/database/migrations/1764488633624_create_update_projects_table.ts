import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'projects'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('version').nullable()
      table.date('start_date').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('version')
      table.dropColumn('start_date')
    })
  }
}
