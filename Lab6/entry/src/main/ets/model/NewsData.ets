export class NewsArticle {
  id: string = '';
  title: string = '';
  description: string = '';
  content: string = '';
  source: string = '';
  author: string = '';
  url: string = '';
  imageUrl: string = '';
  publishTime: string = '';
  category: string = '';

  static fromApi(data: Record<string, Object>): NewsArticle {
    let a = new NewsArticle();
    a.id = (data['id'] as string) || (data['title'] as string) || '';
    a.title = (data['title'] as string) || 'Untitled';
    a.description = (data['description'] as string) || (data['content'] as string) || '';
    a.content = (data['content'] as string) || (data['description'] as string) || '';
    // source may be a string or an object with .name — check runtime type
    let src = data['source'];
    if (typeof src === 'string') {
      a.source = src;
    } else if (typeof src === 'object' && src !== null) {
      a.source = ((src as Record<string, Object>)['name'] as string) || '';
    }
    a.author = (data['author'] as string) || '';
    a.url = (data['url'] as string) || '';
    a.imageUrl = (data['urlToImage'] as string) || (data['imageUrl'] as string) || '';
    a.publishTime = (data['publishedAt'] as string) || (data['publishTime'] as string) || '';
    a.category = (data['category'] as string) || 'general';
    return a;
  }
}

export class NewsCategory {
  name: string = '';
  displayName: string = '';

  constructor(name: string, displayName: string) {
    this.name = name;
    this.displayName = displayName;
  }
}

export const CATEGORIES: NewsCategory[] = [
  new NewsCategory('technology', '科技'),
  new NewsCategory('sports', '体育'),
  new NewsCategory('business', '财经'),
  new NewsCategory('science', '科学'),
  new NewsCategory('health', '健康'),
  new NewsCategory('entertainment', '娱乐'),
];
