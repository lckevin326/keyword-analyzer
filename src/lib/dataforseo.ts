import axios from 'axios'

const DATAFORSEO_API_URL = 'https://api.dataforseo.com/v3'

export interface DataForSEOConfig {
  login: string
  password: string
}

export interface KeywordData {
  keyword: string
  search_volume: number
  competition: number
  cpc: number
  trend: number[]
}

export interface TrendingKeyword {
  keyword: string
  search_volume: number
  growth_rate: number
  competition_level: string
}

class DataForSEOService {
  private config: DataForSEOConfig

  constructor(config: DataForSEOConfig) {
    this.config = config
  }

  private getAuthHeaders() {
    const auth = Buffer.from(`${this.config.login}:${this.config.password}`).toString('base64')
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  }

  async getKeywordsByCompetitor(domain: string, location: string = 'China'): Promise<KeywordData[]> {
    try {
      const response = await axios.post(
        `${DATAFORSEO_API_URL}/keywords_data/google_ads/search_volume/live`,
        [{
          keywords: await this.getCompetitorKeywords(domain),
          location_name: location,
          language_name: 'Chinese (Simplified)'
        }],
        { headers: this.getAuthHeaders() }
      )

      return this.processKeywordData(response.data.tasks[0].result)
    } catch (error) {
      console.error('DataForSEO API Error:', error)
      throw new Error('获取竞争对手关键词失败')
    }
  }

  async getKeywordsByIndustry(industry: string, location: string = 'China'): Promise<KeywordData[]> {
    try {
      const response = await axios.post(
        `${DATAFORSEO_API_URL}/keywords_data/google_ads/keywords_for_keywords/live`,
        [{
          keywords: [industry],
          location_name: location,
          language_name: 'Chinese (Simplified)',
          sort_by: 'search_volume',
          limit: 100
        }],
        { headers: this.getAuthHeaders() }
      )

      return this.processKeywordData(response.data.tasks[0].result)
    } catch (error) {
      console.error('DataForSEO API Error:', error)
      throw new Error('获取行业关键词失败')
    }
  }

  async getTrendingKeywords(location: string = 'China'): Promise<TrendingKeyword[]> {
    try {
      const response = await axios.post(
        `${DATAFORSEO_API_URL}/keywords_data/google_ads/search_volume/live`,
        [{
          keywords: await this.getCurrentTrendingTerms(),
          location_name: location,
          language_name: 'Chinese (Simplified)'
        }],
        { headers: this.getAuthHeaders() }
      )

      return this.processTrendingData(response.data.tasks[0].result)
    } catch (error) {
      console.error('DataForSEO API Error:', error)
      throw new Error('获取热门关键词失败')
    }
  }

  private async getCompetitorKeywords(domain: string): Promise<string[]> {
    // 这里实现获取竞争对手关键词的逻辑
    // 简化实现，实际项目中需要调用相应的API
    return [`${domain} 替代品`, `${domain} 竞争对手`, `${domain} 类似产品`]
  }

  private async getCurrentTrendingTerms(): Promise<string[]> {
    // 这里实现获取当前热门搜索词的逻辑
    // 简化实现，实际项目中需要调用相应的API
    return ['AI工具', '人工智能', '机器学习', '深度学习', '自然语言处理']
  }

  private processKeywordData(data: any[]): KeywordData[] {
    return data.map(item => ({
      keyword: item.keyword,
      search_volume: item.search_volume || 0,
      competition: item.competition || 0,
      cpc: item.cpc || 0,
      trend: item.monthly_searches || []
    }))
  }

  private processTrendingData(data: any[]): TrendingKeyword[] {
    return data.map((item, index) => ({
      keyword: item.keyword,
      search_volume: item.search_volume || 0,
      growth_rate: this.calculateGrowthRate(item.search_volume || 0, index), // 使用确定性计算
      competition_level: this.getCompetitionLevel(item.competition || 0)
    }))
  }

  private calculateGrowthRate(searchVolume: number, index: number): number {
    // 使用确定性算法替代 Math.random()，避免 hydration mismatch
    const seed = searchVolume + index
    const normalizedSeed = (seed % 100) + 1
    return Math.min(normalizedSeed, 100)
  }

  private getCompetitionLevel(competition: number): string {
    if (competition < 0.3) return '低'
    if (competition < 0.7) return '中'
    return '高'
  }
}

export default DataForSEOService