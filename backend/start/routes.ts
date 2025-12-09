/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const ProjectsController = () => import('#controllers/projects_controller')
const ActivitiesController = () => import('#controllers/activities_controller')
const ResourcesController = () => import('#controllers/resources_controller')
const AuthController = () => import('#controllers/auth_controller')
const NotesController = () => import('#controllers/notes_controller')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router
  .group(() => {
    // PROJECTS
    router
      .group(() => {
        router.post('/', [ProjectsController, 'store'])
        router.get('/', [ProjectsController, 'list'])
        router.get('/:id', [ProjectsController, 'get'])
        router.put('/:id', [ProjectsController, 'update'])
      })
      .use(
        middleware.auth({
          guards: ['api'],
        })
      )
      .prefix('projects')
    // ACTIVITIES
    router
      .group(() => {
        router.get('/', [ActivitiesController, 'list'])
      })
      .use(
        middleware.auth({
          guards: ['api'],
        })
      )
      .prefix('activities')
    // RESOURCES
    router
      .group(() => {
        router.get('/', [ResourcesController, 'list'])
      })
      .use(
        middleware.auth({
          guards: ['api'],
        })
      )
      .prefix('resources')
    // AUTH
    router
      .group(() => {
        router.post('login', [AuthController, 'login'])
        router.post('logout', [AuthController, 'logout']).use(
          middleware.auth({
            guards: ['api'],
          })
        )
      })
      .prefix('auth')
    // NOTES
    router
      .group(() => {
        router.get('/', [NotesController, 'list'])
        router.get('/:id', [NotesController, 'get'])
        router.post('/', [NotesController, 'store'])
        router.put('/:id', [NotesController, 'update'])
        router.delete('/:id', [NotesController, 'destroy'])
      })
      .use(
        middleware.auth({
          guards: ['api'],
        })
      )
      .prefix('notes')
  })
  .prefix('api/v1')
