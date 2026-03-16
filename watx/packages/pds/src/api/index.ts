import { AppContext } from '../context'
import { Server } from '../lexicon'
import appBsky from './app/bsky'
import comAtproto from './com/atproto'
import comPara from './com/para'

export default function (server: Server, ctx: AppContext) {
  comAtproto(server, ctx)
  comPara(server, ctx)
  appBsky(server, ctx)
  return server
}
