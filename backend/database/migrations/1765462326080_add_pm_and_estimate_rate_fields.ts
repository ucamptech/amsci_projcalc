import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected projectsTable = 'projects'
  protected estimatesTable = 'estimates'

  async up() {
    this.schema.alterTable(this.projectsTable, (table) => {
      table.decimal('pm_rate', 12, 2).nullable()
      table.decimal('pm_mandays', 12, 2).nullable()
    })

    this.schema.alterTable(this.estimatesTable, (table) => {
      table.decimal('rate', 12, 2).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.estimatesTable, (table) => {
      table.dropColumn('rate')
    })

    this.schema.alterTable(this.projectsTable, (table) => {
      table.dropColumn('pm_rate')
      table.dropColumn('pm_mandays')
    })
  }
}
