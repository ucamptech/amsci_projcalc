import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Activity from '#models/activity'

export default class extends BaseSeeder {
  async run() {
    const uniqueKey = 'wbsId'

    await Activity.updateOrCreateMany(uniqueKey, [
      {
        wbsId: '2.1',
        activity: 'Requirements Gathering',
      },
      {
        wbsId: '2.2',
        activity: 'Functional Design',
      },
      {
        wbsId: '3.1',
        activity: 'Code Development',
      },
      {
        wbsId: '4.1',
        activity: 'Unit Testing',
      },
      {
        wbsId: '5.1',
        activity: 'UAT Support',
      },
      {
        wbsId: '6.1',
        activity: 'Post PRD Support',
      },
    ])
  }
}
