import { NewsArticle, NewsCategory, CATEGORIES } from '../model/NewsData';
import { NewsApi } from '../model/NewsApi';

@Entry
@Component
struct Index {
  @StorageLink('currentBreakpoint') breakpoint: string = 'sm';
  @State articles: NewsArticle[] = [];
  @State currentCategory: string = 'technology';
  @State selectedArticle: NewsArticle | null = null;
  @State isLoading: boolean = false;
  @State showDetail: boolean = false;

  aboutToAppear(): void {
    this.loadNews();
  }

  async loadNews(): Promise<void> {
    this.isLoading = true;
    this.selectedArticle = null;
    this.showDetail = false;

    let data = await NewsApi.fetchNews(this.currentCategory);
    if (data.length === 0) {
      data = NewsApi.getFallbackData(this.currentCategory);
    }
    this.articles = data;
    this.isLoading = false;

    // On tablet+, auto-select first article
    if (this.breakpoint !== 'sm' && data.length > 0) {
      this.selectedArticle = data[0];
    }
  }

  selectCategory(cat: NewsCategory): void {
    this.currentCategory = cat.name;
    this.loadNews();
  }

  selectArticle(article: NewsArticle): void {
    this.selectedArticle = article;
    this.showDetail = true;
  }

  goBack(): void {
    this.showDetail = false;
    this.selectedArticle = null;
  }

  // ======== Build: Shared components ========

  @Builder
  CategoryBar() {
    Scroll() {
      Row() {
        ForEach(CATEGORIES, (cat: NewsCategory) => {
          Text(cat.displayName)
            .fontSize(14)
            .fontColor(this.currentCategory === cat.name ? '#ffffff' : '#888888')
            .fontWeight(this.currentCategory === cat.name ? FontWeight.Bold : FontWeight.Normal)
            .backgroundColor(this.currentCategory === cat.name ? '#4facfe' : 'rgba(255,255,255,0.06)')
            .borderRadius(20)
            .padding({ left: 16, right: 16, top: 6, bottom: 6 })
            .margin({ right: 8 })
            .onClick(() => { this.selectCategory(cat); })
        })
      }
      .padding({ left: 16, right: 16 })
    }
    .scrollable(ScrollDirection.Horizontal)
    .scrollBar(BarState.Off)
    .height(44)
  }

  @Builder
  NewsListPanel() {
    if (this.isLoading) {
      Column() {
        LoadingProgress().color('#4facfe').width(32).height(32)
        Text('加载中...').fontSize(13).fontColor('#666666').margin({ top: 8 })
      }
      .width('100%')
      .layoutWeight(1)
      .justifyContent(FlexAlign.Center)
    } else {
      List() {
        ForEach(this.articles, (article: NewsArticle) => {
          ListItem() {
            Row() {
              Column() {
                Text(article.title)
                  .fontSize(this.breakpoint === 'sm' ? 15 : 16)
                  .fontWeight(this.selectedArticle?.id === article.id ? FontWeight.Bold : FontWeight.Normal)
                  .fontColor(this.selectedArticle?.id === article.id ? '#4facfe' : '#e0e0e0')
                  .maxLines(2)
                  .textOverflow({ overflow: TextOverflow.Ellipsis })

                Row() {
                  Text(article.source)
                    .fontSize(11)
                    .fontColor('#666666')
                  Text('  ' + this.formatTime(article.publishTime))
                    .fontSize(11)
                    .fontColor('#555555')
                }
                .margin({ top: 6 })
              }
              .alignItems(HorizontalAlign.Start)
              .layoutWeight(1)
            }
            .width('100%')
            .padding(14)
            .backgroundColor(this.selectedArticle?.id === article.id ? 'rgba(79,172,254,0.08)' : 'rgba(255,255,255,0.03)')
            .borderRadius(10)
            .border({
              width: this.selectedArticle?.id === article.id ? 1 : 0,
              color: 'rgba(79,172,254,0.3)'
            })
            .onClick(() => { this.selectArticle(article); })
          }
          .margin({ bottom: 8, left: 12, right: 12 })
        })
      }
      .layoutWeight(1)
    }
  }

  @Builder
  ArticleDetailPanel() {
    if (this.selectedArticle) {
      Scroll() {
        Column() {
          // Back button on phone
          if (this.breakpoint === 'sm') {
            Row() {
              Button('← 返回')
                .fontSize(14)
                .fontColor('#4facfe')
                .backgroundColor('transparent')
                .onClick(() => { this.goBack(); })
              Blank()
            }
            .width('100%')
            .padding({ left: 16, right: 16, top: 8, bottom: 8 })
          }

          // Source
          Text(this.selectedArticle.source)
            .fontSize(12)
            .fontColor('#4facfe')
            .fontWeight(FontWeight.Medium)

          // Title
          Text(this.selectedArticle.title)
            .fontSize(this.breakpoint === 'sm' ? 20 : 24)
            .fontWeight(FontWeight.Bold)
            .fontColor('#ffffff')
            .margin({ top: 8 })

          // Meta
          Text(`${this.selectedArticle.author || '未知作者'} · ${this.formatTime(this.selectedArticle.publishTime)}`)
            .fontSize(12)
            .fontColor('#666666')
            .margin({ top: 8, bottom: 20 })

          // Content
          Text(this.selectedArticle.content || this.selectedArticle.description)
            .fontSize(this.breakpoint === 'sm' ? 15 : 16)
            .fontColor('#bbbbbb')
            .lineHeight(28)
        }
        .alignItems(HorizontalAlign.Start)
        .padding({ left: 20, right: 20, bottom: 40 })
      }
      .layoutWeight(1)
    } else {
      Column() {
        Text('选择一篇文章查看详情')
          .fontSize(14)
          .fontColor('#555555')
      }
      .width('100%')
      .layoutWeight(1)
      .justifyContent(FlexAlign.Center)
    }
  }

  formatTime(iso: string): string {
    if (!iso) return '';
    try {
      let d = new Date(iso);
      let m = (d.getMonth() + 1).toString().padStart(2, '0');
      let day = d.getDate().toString().padStart(2, '0');
      return `${m}-${day}`;
    } catch (e) { return ''; }
  }

  // ======== Main Build ========

  build() {
    Column() {
      // Header
      Row() {
        Text('NewsReader')
          .fontSize(this.breakpoint === 'sm' ? 22 : 28)
          .fontWeight(FontWeight.Bold)
          .fontColor('#ffffff')
      }
      .width('100%')
      .padding({ left: 20, right: 20, top: 14, bottom: 8 })

      this.CategoryBar()

      Divider()
        .color('rgba(255,255,255,0.06)')
        .margin({ top: 8 })

      // ---- SM: Phone - single page, stack navigation ----
      if (this.breakpoint === 'sm') {
        if (this.showDetail && this.selectedArticle) {
          this.ArticleDetailPanel()
        } else {
          this.NewsListPanel()
        }
      }

      // ---- MD: Tablet/Foldable - two-column: list | detail ----
      if (this.breakpoint === 'md') {
        Row() {
          Column() {
            this.NewsListPanel()
          }
          .width('35%')
          .height('100%')

          Divider()
            .vertical(true)
            .strokeWidth(1)
            .color('rgba(255,255,255,0.06)')

          Column() {
            this.ArticleDetailPanel()
          }
          .width('65%')
          .height('100%')
        }
        .layoutWeight(1)
        .width('100%')
      }

      // ---- LG: Desktop/2-in-1 - three-column: category | list | detail ----
      if (this.breakpoint === 'lg') {
        Row() {
          // Left: Category sidebar
          Column() {
            Text('分类')
              .fontSize(13)
              .fontColor('#666666')
              .fontWeight(FontWeight.Medium)
              .margin({ bottom: 12 })

            ForEach(CATEGORIES, (cat: NewsCategory) => {
              Text(cat.displayName)
                .fontSize(14)
                .fontColor(this.currentCategory === cat.name ? '#ffffff' : '#888888')
                .fontWeight(this.currentCategory === cat.name ? FontWeight.Bold : FontWeight.Normal)
                .backgroundColor(this.currentCategory === cat.name ? 'rgba(79,172,254,0.15)' : 'transparent')
                .borderRadius(8)
                .padding({ left: 12, right: 12, top: 8, bottom: 8 })
                .width('100%')
                .textAlign(TextAlign.Start)
                .margin({ bottom: 4 })
                .onClick(() => { this.selectCategory(cat); })
            })
          }
          .width('15%')
          .height('100%')
          .padding(16)

          Divider()
            .vertical(true)
            .strokeWidth(1)
            .color('rgba(255,255,255,0.06)')

          // Middle: News list
          Column() {
            this.NewsListPanel()
          }
          .width('30%')
          .height('100%')

          Divider()
            .vertical(true)
            .strokeWidth(1)
            .color('rgba(255,255,255,0.06)')

          // Right: Article detail
          Column() {
            this.ArticleDetailPanel()
          }
          .width('55%')
          .height('100%')
        }
        .layoutWeight(1)
        .width('100%')
      }
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#0a0a0a')
  }
}
