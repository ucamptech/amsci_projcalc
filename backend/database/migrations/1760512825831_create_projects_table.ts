import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'projects'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name')
      table.string('manager')
      table.string('sponsor')
      table.string('business_need')
      table.string('project_goal')
      table.string('measurable_objectives')
      table.string('deliverables')
      table.string('out_of_scope')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
