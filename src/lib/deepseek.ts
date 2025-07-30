import axios from 'axios'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

export interface DeepSeekConfig {
  apiKey: string
}

export interface ContentOutlineRequest {
  target_keyword: string
  selected_title?: string // 新增：可选的选中标题
  target_audience: string
  search_intent: 'informational' | 'commercial' | 'transactional'
  common_themes: string[]
  unique_angles: string[]
  user_questions: string[]
}

export interface TitleGenerationRequest {
  target_keyword: string
  core_angle: string
}

export interface ContentOutlineResponse {
  outline: string
  h1_title: string
  main_sections: Array<{
    h2_title: string
    h3_subsections: string[]
    key_points: string[]
  }>
  estimated_word_count: number
}

export interface TitleGenerationResponse {
  titles: Array<{
    title: string
    type: string
    appeal_factor: number
    seo_optimized: boolean
  }>
}

class DeepSeekService {
  private config: DeepSeekConfig

  constructor(config: DeepSeekConfig) {
    this.config = config
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json'
    }
  }

  // AI内容大纲生成
  async generateContentOutline(request: ContentOutlineRequest): Promise<ContentOutlineResponse> {
    try {
      const prompt = this.buildOutlinePrompt(request)
      
      const response = await axios.post(
        DEEPSEEK_API_URL,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一位顶级的SEO内容策略专家。你的任务是根据提供的上下文数据，创建一个结构完整、逻辑清晰、且经过SEO优化的文章大纲。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000
        },
        { headers: this.getHeaders() }
      )

      const generatedContent = response.data.choices[0].message.content
      return this.parseOutlineResponse(generatedContent, request.target_keyword)

    } catch (error) {
      console.error('DeepSeek 内容大纲生成失败，使用Mock数据:', error)
      // 返回Mock数据作为回退
      return this.generateMockOutline(request.target_keyword)
    }
  }

  // 标题创意生成
  async generateTitles(request: TitleGenerationRequest): Promise<TitleGenerationResponse> {
    try {
      const prompt = this.buildTitlePrompt(request)
      
      const response = await axios.post(
        DEEPSEEK_API_URL,
        {
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: '你是一位经验丰富的数字营销专家和文案大师，擅长创作高点击率(CTR)的标题。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 1500
        },
        { headers: this.getHeaders() }
      )

      const generatedContent = response.data.choices[0].message.content
      return this.parseTitleResponse(generatedContent)

    } catch (error) {
      console.error('DeepSeek 标题生成失败，使用Mock数据:', error)
      // 返回Mock数据作为回退
      return this.generateMockTitles(request.target_keyword)
    }
  }

  private buildOutlinePrompt(request: ContentOutlineRequest): string {
    const titleSection = request.selected_title 
      ? `- **选定标题 (Selected Title):** ${request.selected_title}`
      : '';

    return `
# 角色与目标 (ROLE & GOAL)
你是一位顶级的SEO内容策略专家。你的任务是根据我提供的上下文数据，创建一个结构完整、逻辑清晰、且经过SEO优化的文章大纲。这份大纲将作为清晰的写作蓝图，帮助作者写出一篇能够在搜索引擎上获得良好排名的文章。

# 上下文与数据 (CONTEXT & DATA)
以下是你构建大纲必须使用的信息：

### 1. 核心信息
- **目标关键词 (Target Keyword):** ${request.target_keyword}
${titleSection}
- **目标受众 (Target Audience):** ${request.target_audience}
- **搜索意图 (Search Intent):** ${request.search_intent}

### 2. 竞品分析 (排名前10文章的摘要)
- **常见主题与子话题:**
${request.common_themes.map(theme => `  - ${theme}`).join('\n')}
- **发现的独特角度:**
${request.unique_angles.map(angle => `  - ${angle}`).join('\n')}

### 3. 用户问题 (来源于 "People Also Ask" 的数据)
${request.user_questions.map(q => `- ${q}`).join('\n')}

# 指令 (INSTRUCTIONS)
请基于以上所有信息，生成文章大纲。请严格遵守以下规则：
1.  **结构:** 使用 Markdown 格式，包含一个H1标题，多个H2标题，以及相关的H3标题。
2.  **H1标题处理:** ${request.selected_title ? `使用选定的标题 "${request.selected_title}" 作为H1标题，确保它包含目标关键词 "${request.target_keyword}"。` : `H1标题必须引人注目，并包含 "${request.target_keyword}"`}
3.  **逻辑流畅:** 大纲的逻辑必须顺畅，从基础概念开始，逐步深入到更高级或具体的话题。${request.selected_title ? `大纲结构应与选定标题的承诺和期望保持一致。` : ''}
4.  **整合问题:** 将"用户问题"的答案无缝地整合到相关的H2或H3部分中，而不是简单地罗列问题。
5.  **覆盖全面:** 确保大纲覆盖了所选择的"常见主题"和"独特角度"，使内容脱颖而出。
6.  **实践性内容:** 包含对 ${request.target_audience} 有实际价值的部分，例如"操作步骤"、"最佳实践"或"要避免的常见错误"。
7.  **结论:** 以一个"结论"或"核心要点"部分作为结尾，总结文章的主要观点。

# 输出格式 (OUTPUT FORMAT)
请直接以H1标题开始输出大纲，不要在前面添加任何评论或介绍性文字。
`
  }

  private buildTitlePrompt(request: TitleGenerationRequest): string {
    return `
# 角色与目标 (ROLE & GOAL)
你是一位经验丰富的数字营销专家和文案大师，擅长创作高点击率 (CTR) 的标题。你的任务是为一篇文章生成 10-12 个多样化且吸引人的标题方案。

# 上下文 (CONTEXT)
- **目标关键词 (Target Keyword):** ${request.target_keyword}
- **文章核心角度/价值点 (Article's Core Angle/Benefit):** ${request.core_angle}

# 指令 (INSTRUCTIONS)
请根据上下文生成 10-12 个标题方案。请遵循以下规则：
1.  **SEO优先:** 大部分标题应突出显示完整的 "${request.target_keyword}"，最好是放在标题的开头部分。
2.  **清晰并体现价值:** 每个标题都必须清晰地传达读者将获得的好处或价值。
3.  **多样性是关键:** 你必须使用多种经过验证的高点击率标题格式来生成方案。请混合使用以下风格：
    *   **"如何做"/指南类:** (例如: 如何使用X来实现Y)
    *   **"列表"类:** (例如: 7个经过验证的X方法可以...)
    *   **"错误"/规避风险类:** (例如: 你是否正在犯这5个关于X的错误？)
    *   **"提问"类:** (例如: X真的是...的最佳解决方案吗？)
    *   **"秘密"/大胆承诺类:** (例如: 用X解锁...的秘密)
    *   **"反向"角度类:** (例如: 在读完这篇文章前，别再用X了)
    *   **"数据驱动"类:** (例如: 我们分析了100个案例：这是我们关于X的发现)
4.  **保持简洁:** 标题的理想长度应在60个字符以内。

# 输出格式 (OUTPUT FORMAT)
请以数字列表的格式输出，不要添加任何介绍性文字、解释或评论。
`
  }

  private parseOutlineResponse(content: string, targetKeyword: string): ContentOutlineResponse {
    const sections = content.split('\n').filter(line => line.trim())
    
    sections.forEach((section) => {
      if (section.includes('##')) {
        // 处理二级标题
      }
    })

    // 保存最后一个section
    if (currentH2) {
      mainSections.push({
        h2_title: currentH2,
        h3_subsections: currentH3s,
        key_points: currentPoints
      })
    }

    return {
      outline: content,
      h1_title: h1Title,
      main_sections: mainSections,
      estimated_word_count: mainSections.length * 300 // 估算字数
    }
  }

  private parseTitleResponse(content: string): TitleGenerationResponse {
    const lines = content.split('\n').filter(line => line.trim() && /^\d+\./.test(line.trim()))
    
    const titles = lines.map((line, index) => {
      const title = line.replace(/^\d+\.\s*/, '').trim()
      const type = this.determineTitleType(title)
      
      return {
        title,
        type,
        appeal_factor: 85, // 固定吸引力评分
        seo_optimized: title.length <= 60 && title.length >= 30
      }
    })

    return { titles }
  }

  private determineTitleType(title: string): string {
    const lowerTitle = title.toLowerCase()
    
    if (lowerTitle.includes('如何') || lowerTitle.includes('怎么')) return '指南类'
    if (/\d+个|[0-9]+种/.test(title)) return '列表类'
    if (lowerTitle.includes('错误') || lowerTitle.includes('避免')) return '规避风险类'
    if (title.includes('？') || title.includes('?')) return '提问类'
    if (lowerTitle.includes('秘密') || lowerTitle.includes('解锁')) return '秘密类'
    if (lowerTitle.includes('别再') || lowerTitle.includes('停止')) return '反向角度类'
    if (lowerTitle.includes('分析') || lowerTitle.includes('研究')) return '数据驱动类'
    
    return '通用类'
  }

  // Mock 数据生成方法
  private generateMockOutline(targetKeyword: string): ContentOutlineResponse {
    const h1Title = `${targetKeyword}：完整指南和最佳实践`
    
    const mainSections = [
      {
        h2_title: `什么是${targetKeyword}`,
        h3_subsections: [
          `${targetKeyword}的定义和基本概念`,
          `${targetKeyword}的核心要素`,
          `${targetKeyword}的工作原理`
        ],
        key_points: [
          '深入解释基本概念',
          '分析核心组成部分',
          '提供清晰的工作流程'
        ]
      },
      {
        h2_title: `${targetKeyword}的重要性和好处`,
        h3_subsections: [
          `为什么${targetKeyword}很重要`,
          `${targetKeyword}带来的主要好处`,
          '实际应用场景'
        ],
        key_points: [
          '量化具体收益',
          '展示真实案例',
          '解释长期价值'
        ]
      },
      {
        h2_title: `如何实施${targetKeyword}`,
        h3_subsections: [
          '准备工作和前置条件',
          '逐步实施指南',
          '工具和资源推荐'
        ],
        key_points: [
          '提供可操作的步骤',
          '推荐实用工具',
          '分享最佳实践'
        ]
      },
      {
        h2_title: `${targetKeyword}的常见误区和挑战`,
        h3_subsections: [
          '新手容易犯的错误',
          '实施过程中的挑战',
          '如何避免常见陷阱'
        ],
        key_points: [
          '列举具体错误案例',
          '提供解决方案',
          '分享预防措施'
        ]
      },
      {
        h2_title: `${targetKeyword}的未来趋势`,
        h3_subsections: [
          '行业发展趋势',
          '新技术的影响',
          '未来发展预测'
        ],
        key_points: [
          '分析市场动向',
          '探讨技术创新',
          '提供前瞻性见解'
        ]
      }
    ]

    const outlineContent = `# ${h1Title}

## ${mainSections[0].h2_title}

### ${mainSections[0].h3_subsections[0]}
- ${mainSections[0].key_points[0]}
- ${mainSections[0].key_points[1]}

### ${mainSections[0].h3_subsections[1]}
- ${mainSections[0].key_points[2]}

### ${mainSections[0].h3_subsections[2]}
- 详细说明工作流程
- 提供图表和示例

## ${mainSections[1].h2_title}

### ${mainSections[1].h3_subsections[0]}
- ${mainSections[1].key_points[0]}
- ${mainSections[1].key_points[1]}

### ${mainSections[1].h3_subsections[1]}
- 提升效率和质量
- 降低成本和风险
- 增强竞争优势

### ${mainSections[1].h3_subsections[2]}
- ${mainSections[1].key_points[2]}

## ${mainSections[2].h2_title}

### ${mainSections[2].h3_subsections[0]}
- 评估现有资源
- 制定实施计划
- 团队培训和准备

### ${mainSections[2].h3_subsections[1]}
- ${mainSections[2].key_points[0]}
- ${mainSections[2].key_points[1]}

### ${mainSections[2].h3_subsections[2]}
- ${mainSections[2].key_points[2]}

## ${mainSections[3].h2_title}

### ${mainSections[3].h3_subsections[0]}
- ${mainSections[3].key_points[0]}
- ${mainSections[3].key_points[1]}

### ${mainSections[3].h3_subsections[1]}
- 技术挑战及应对
- 资源限制的解决方案

### ${mainSections[3].h3_subsections[2]}
- ${mainSections[3].key_points[2]}

## ${mainSections[4].h2_title}

### ${mainSections[4].h3_subsections[0]}
- ${mainSections[4].key_points[0]}
- ${mainSections[4].key_points[1]}

### ${mainSections[4].h3_subsections[1]}
- ${mainSections[4].key_points[2]}

## 总结

- 回顾${targetKeyword}的核心要点
- 强调实施的重要性
- 鼓励读者立即行动`

    return {
      outline: outlineContent,
      h1_title: h1Title,
      main_sections: mainSections,
      estimated_word_count: mainSections.length * 300
    }
  }

  private generateMockTitles(targetKeyword: string): TitleGenerationResponse {
    const titles = [
      {
        title: `${targetKeyword}完整指南：从入门到精通的实用教程`,
        type: '指南类',
        appeal_factor: 88,
        seo_optimized: true
      },
      {
        title: `10个${targetKeyword}最佳实践，让你快速提升效果`,
        type: '列表类',
        appeal_factor: 92,
        seo_optimized: true
      },
      {
        title: `你是否正在犯这5个${targetKeyword}的错误？`,
        type: '规避风险类',
        appeal_factor: 85,
        seo_optimized: true
      },
      {
        title: `${targetKeyword}真的是提升业绩的最佳方法吗？`,
        type: '提问类',
        appeal_factor: 82,
        seo_optimized: true
      },
      {
        title: `用${targetKeyword}解锁成功的秘密：专家分享独家技巧`,
        type: '秘密类',
        appeal_factor: 90,
        seo_optimized: false
      },
      {
        title: `在学会${targetKeyword}之前，别再浪费时间了`,
        type: '反向角度类',
        appeal_factor: 87,
        seo_optimized: true
      },
      {
        title: `我们分析了1000个案例：这是${targetKeyword}的最新发现`,
        type: '数据驱动类',
        appeal_factor: 94,
        seo_optimized: false
      },
      {
        title: `如何通过${targetKeyword}在30天内提升200%效果`,
        type: '指南类',
        appeal_factor: 91,
        seo_optimized: true
      },
      {
        title: `7种${targetKeyword}策略，每个专业人士都应该知道`,
        type: '列表类',
        appeal_factor: 86,
        seo_optimized: true
      },
      {
        title: `${targetKeyword}vs传统方法：哪个更有效？`,
        type: '对比类',
        appeal_factor: 83,
        seo_optimized: true
      },
      {
        title: `2024年${targetKeyword}终极手册：最新趋势和技巧`,
        type: '通用类',
        appeal_factor: 89,
        seo_optimized: true
      },
      {
        title: `专家解密：${targetKeyword}背后的成功公式`,
        type: '秘密类',
        appeal_factor: 88,
        seo_optimized: true
      }
    ]

    return { titles }
  }
}

export default DeepSeekService





