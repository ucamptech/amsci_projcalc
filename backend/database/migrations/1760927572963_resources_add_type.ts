import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'resources'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('resource_type_id').unsigned().references('resource_types.id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign('resource_type_id')
      table.dropColumn('resource_type_id')
    })
  }
}
