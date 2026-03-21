import { Client as PlcClient } from '@did-plc/lib'
import * as plc from '@did-plc/server'
import getPort from 'get-port'
import { PlcConfig } from './types'

export class TestPlc {
  constructor(
    public url: string,
    public port: number,
    public db: plc.PlcDatabase,
    public server: plc.PlcServer,
  ) {}

  static async create(cfg: PlcConfig): Promise<TestPlc> {
    let db: plc.PlcDatabase
    if (cfg.dbUrl) {
      const pgDb = plc.Database.postgres({
        url: cfg.dbUrl,
        schema: cfg.dbSchema,
      })
      await pgDb.migrateToLatestOrThrow()
      db = pgDb
    } else {
      db = plc.Database.mock()
    }
    const port = cfg.port || (await getPort())
    const url = `http://localhost:${port}`
    const server = plc.PlcServer.create({ db, port, version: cfg.version })
    await server.start()
    return new TestPlc(url, port, db, server)
  }

  get ctx(): plc.AppContext {
    return this.server.ctx
  }

  getClient(): PlcClient {
    return new PlcClient(this.url)
  }

  async close() {
    await this.server.destroy()
    await this.db.close()
  }
}
