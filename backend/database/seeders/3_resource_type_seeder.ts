import { BaseSeeder } from '@adonisjs/lucid/seeders'
import ResourceType from '#models/resource_type'

export default class extends BaseSeeder {
  async run() {
    // Write your database queries inside the run method
    const uniqueKey = 'name'

    await ResourceType.updateOrCreateMany(uniqueKey, [
      {
        name: 'Functional',
      },
      {
        name: 'Technical',
      },
    ])
  }
}
