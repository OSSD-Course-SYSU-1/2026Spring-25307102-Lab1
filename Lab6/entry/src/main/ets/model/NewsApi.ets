import http from '@ohos.net.http';
import { NewsArticle, CATEGORIES } from '../model/NewsData';

// Free public API: NewsAPI or similar
const API_KEY = 'pub_664720d7128f46efb5cb51a5e42cdfdb867da';
const BASE_URL = 'https://newsdata.io/api/1/news';

export class NewsApi {
  static async fetchNews(category: string): Promise<NewsArticle[]> {
    let url = `${BASE_URL}?apikey=${API_KEY}&category=${category}&language=zh`;
    let req = http.createHttp();
    try {
      let resp = await req.request(url, { method: http.RequestMethod.GET, connectTimeout: 10000, readTimeout: 10000 });

      if (resp.responseCode === 200) {
        let body = resp.result as string;
        let json = JSON.parse(body) as Record<string, Object>;
        let articles = json['results'] as Array<Record<string, Object>>;
        if (articles && articles.length > 0) {
          return articles.map(item => NewsArticle.fromApi(item));
        }
      }
    } catch (e) {
      console.error('News API error: ' + JSON.stringify(e));
    } finally {
      req.destroy();
    }
    return [];
  }

  static getFallbackData(category: string): NewsArticle[] {
    let items: NewsArticle[] = [];
    let cat = CATEGORIES.find(c => c.name === category);
    let catName = cat ? cat.displayName : category;
    for (let i = 0; i < 15; i++) {
      let a = new NewsArticle();
      a.id = `${category}_${i}`;
      a.title = `[${catName}] 新闻标题 ${i + 1}：人工智能推动行业变革`;
      a.description = `这是关于${catName}领域的第${i + 1}条新闻摘要。随着技术不断发展，该行业正经历深刻变化，专家预测未来几年将出现更多创新应用场景。`;
      a.content = `本报讯 近日，${catName}领域迎来重大突破。业内专家表示，新技术的应用将极大提升效率，降低成本。多家企业已开始布局相关产业链，预计明年市场规模将翻倍增长。\n\n据悉，该技术已在多个场景进行试点，效果显著。消费者反馈积极，市场前景广阔。分析师认为，这将成为下一个风口。`;
      a.source = '科技日报';
      a.author = '记者 张华';
      a.imageUrl = '';
      a.publishTime = new Date(Date.now() - i * 3600000).toISOString();
      a.category = category;
      items.push(a);
    }
    return items;
  }
}
