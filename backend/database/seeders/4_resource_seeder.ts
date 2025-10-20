import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Resource from '#models/resource'

export default class extends BaseSeeder {
  async run() {
    const uniqueKey = 'name'

    await Resource.updateOrCreateMany(uniqueKey, [
      {
        name: 'Test Resource 1',
        title: 'Functional Consultant',
        cost: 100.0,
        resourceTypeId: 1,
      },
      {
        name: 'Test Resource 2',
        title: 'Technical Consultant',
        cost: 100.0,
        resourceTypeId: 2,
      },
    ])
  }
}
