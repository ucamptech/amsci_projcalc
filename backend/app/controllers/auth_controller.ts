import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'

export default class AuthController {
  async login({ request, auth }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
    const user = await User.verifyCredentials(email, password)
    return await auth.use('api').createToken(user)
  }
  async logout({ auth }: HttpContext) {
    await auth.use('api').invalidateToken()
    return
  }
}
