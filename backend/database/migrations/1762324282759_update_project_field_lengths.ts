import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'projects'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('measurable_objectives', 1000).alter()
      table.string('deliverables', 1000).alter()
      table.string('out_of_scope', 1000).alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('measurable_objectives', 255).alter()
      table.string('deliverables', 255).alter()
      table.string('out_of_scope', 255).alter()
    })
  }
}
