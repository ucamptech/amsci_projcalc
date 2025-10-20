import type { HttpContext } from '@adonisjs/core/http'
import Resource from '#models/resource'

export default class ResourcesController {
  async list({ request }: HttpContext) {
    const page = request.input('page', 1)
    const limit = 20

    const queryParams = request.qs()
    let query = Resource.query()

    if (queryParams.resourceTypeId) {
      query = query.where('resource_type_id', queryParams.resourceTypeId)
    }

    return query.preload('resourceType').paginate(page, limit)
  }
}
