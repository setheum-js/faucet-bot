import redis, { RedisClient, ClientOpts } from "redis";
import { Pool, PoolConfig } from "pg";
import dayjs, { OpUnitType } from "dayjs";
import { promisify } from "util";
import { values } from "lodash";

interface StorageOptions {
  redis: ClientOpts;
  postgres: PoolConfig;
}

export class Storage {
  private client: RedisClient;
  private postgres: Pool;

  private get: (key: string) => Promise<string | null>;
  private incr: (key: string) => Promise<number>;
  private decr: (key: string) => Promise<number>;
  private expireat: (key: string, timestamp: number) => Promise<number>;

  constructor({ redis: redisConfig, postgres: postConf }: StorageOptions) {
    this.client = redis.createClient(redisConfig);
    this.postgres = new Pool(postConf);

    this.get = promisify(this.client.get).bind(this.client);
    this.incr = promisify(this.client.incr).bind(this.client);
    this.decr = promisify(this.client.decr).bind(this.client);
    this.expireat = promisify(this.client.expireat).bind(this.client);
  }

  async incrKeyCount(key: string, frequency: [string, OpUnitType]): Promise<number> {
    const expireTime = dayjs().add(Number(frequency[0]), frequency[1]).startOf(frequency[1]).unix();

    // preset expire time
    await this.expireat(key, expireTime);

    return this.incr(key);
  }

  async decrKeyCount(key: string): Promise<number> {
    return this.decr(key);
  }

  async getKeyCount(key: string): Promise<number> {
    const result = await this.get(key);

    return Number(result) || 0;
  }

  async queryCandy(address: string): Promise<Array<string>> {
    const candy = [];
    const res = await Promise.all([
      this.postgres.query(`SELECT id FROM public.tc4_address_info WHERE address = '${address}'`),
      this.postgres.query(`SELECT id FROM public.tc3_address_info WHERE address = '${address}'`),
      // this.postgres.query(`SELECT id FROM public.tc2_address_info WHERE address = '${address}'`),
    ]);
    if (res[0].rowCount > 0) {
      candy[candy.length] = "tc4";
    }
    if (res[1].rowCount > 0) {
      candy[candy.length] = "tc3";
    }
    // if (res[2].rowCount > 0) {
    //   candy[candy.length] = 'tc2'
    // }
    return candy;
  }

  async queryCandyDropped(address: string): Promise<number> {
    const res = await this.postgres.query(`SELECT status FROM public.tc5_candy WHERE address = '${address}'`);
    return res.rowCount;
  }

  async addCandyDrop(address: string, aca: number, kar: number, nft: string): Promise<void> {
    await this.postgres.query(`INSERT INTO public.tc5_candy (address, aca, kar, nft) VALUES ($1, $2, $3, $4)`, [address, aca, kar, nft]);
  }

  async updateCandyDrop(address: string): Promise<void> {
    await this.postgres.query(`UPDATE public.tc5_candy SET status = 1 WHERE address = '${address}'`);
  }
}
