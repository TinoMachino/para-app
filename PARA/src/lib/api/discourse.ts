import { AtprotoAgent } from '@atproto/api'
import {
  DiscourseSnapshot,
  TopicCluster,
  SentimentDistribution,
} from './para-lexicons'

export class DiscourseAPI {
  constructor(public agent: AtprotoAgent) {}

  async getSnapshot(params: {
    community?: string
    timeframe: '1h' | '24h' | '7d' | '30d'
  }): Promise<DiscourseSnapshot[]> {
    const res = await this.agent.api.com.para.discourse.getSnapshot(params)
    return res.data.snapshots
  }

  async getTopics(params: {
    community?: string
    timeframe: '1h' | '24h' | '7d' | '30d'
  }): Promise<TopicCluster[]> {
    const res = await this.agent.api.com.para.discourse.getTopics(params)
    return res.data.topics
  }

  async getSentiment(params: {
    community?: string
    timeframe: '1h' | '24h' | '7d' | '30d'
  }): Promise<SentimentDistribution> {
    const res = await this.agent.api.com.para.discourse.getSentiment(params)
    return res.data.sentiment
  }
}
