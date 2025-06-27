class DefaultExtension extends MProvider {
  getHeaders(url) {
    throw new Error("getHeaders not implemented");
  }

  getAnimeFromElement(res) {
    const doc = new Document(res.body);
    const elements = doc.select("div.anime-card-container");
    const list = [];
    for (const el of elements) {
      const name = el.selectFirst(".anime-card-title h3 a").text;
      const link = el.selectFirst(".anime-card-title h3 a").getHref;
      const imageUrl = el.selectFirst("img").getSrc;
      list.push({ name, imageUrl, link });
    }
    const hasNextPage = Boolean(doc.selectFirst("ul.pagination > li > a.next"));
    return { list, hasNextPage };
  }

  async getPopular(page) {
    const res = await new Client().get(
      `${this.BaseUrl}/${this.animeSubString}/page/${page}/`,
    );
    return this.getAnimeFromElement(res);
  }

  async getLatestUpdates(page) {
    const res = await new Client().get(`${this.BaseUrl}/episode/page/${page}/`);
    return this.getAnimeFromElement(res);
  }

  async search(query, page, filters) {
    throw new Error("search not implemented");
  }

  async getDetail(url) {
    throw new Error("getDetail not implemented");
  }

  // For novel html content
  async getHtmlContent(name, url) {
    throw new Error("getHtmlContent not implemented");
  }
  // Clean html up for reader
  async cleanHtmlContent(html) {
    throw new Error("cleanHtmlContent not implemented");
  }
  // For anime episode video list
  async getVideoList(url) {
    throw new Error("getVideoList not implemented");
  }
  // For manga chapter pages
  async getPageList(url) {
    throw new Error("getPageList not implemented");
  }
  getFilterList() {
    throw new Error("getFilterList not implemented");
  }

  get BaseUrl() {
    const preference = new SharedPreferences();
    var base_url = preference.get("base_url");
    if (base_url.length == 0) {
      return this.source.baseUrl;
    }
    if (base_url.endsWith("/")) {
      return base_url.slice(0, -1);
    }
    return base_url;
  }

  getSourcePreferences() {
    return [
      {
        key: "base_url",
        editTextPreference: {
          title: this.getTitleByLang(this.source.lang),
          summary: "",
          value: this.source.baseUrl,
          dialogTitle: "Edit",
          dialogMessage: `Defaul URL ${this.source.baseUrl}`,
        },
      },
    ];
  }

  getTitleByLang(lang) {
    const titles = {
      ar: "تحرير الرابط",
      en: "Edit URL",
      fr: "Modifier l’URL",
      es: "Editar URL",
      de: "URL bearbeiten",
      tr: "URL’yi düzenle",
      ru: "Редактировать URL",
      id: "Edit URL",
      pt: "Editar URL",
      it: "Modifica URL",
      ja: "URLを編集",
      zh: "编辑网址",
      ko: "URL 편집",
      fa: "ویرایش نشانی",
    };

    return titles[lang?.toLowerCase()] ?? titles["en"];
  }

  get animeSubString() {
    const sourceTypeMap = {
      "WIT ANIME": "قائمة-الانمي",
      Anime4Up: "قائمة-الانمي",
    };

    return sourceTypeMap[this.source.name] ?? "anime-list";
  }
}
