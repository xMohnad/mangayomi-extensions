class DefaultExtension extends MProvider {
  toStatus(status) {
    if (!status) return 5; // unknown

    const normalized = status.trim().toLowerCase();
    const keywordsMap = [
      { keywords: ["يعرض الان"], value: 0 },
      { keywords: ["مكتمل"], value: 1 },
    ];

    for (const { keywords, value } of keywordsMap) {
      if (keywords.some((k) => normalized.includes(k))) {
        return value;
      }
    }

    return 5;
  }

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

  //  Chapters
  chapterFromJson(entry) {
    return {
      name: `${entry.type} ${entry.number}`,
      url: entry.url,
    };
  }

  atob_polyfill(input) {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    let str = String(input).replace(/=+$/, "");
    let output = "";

    if (str.length % 4 === 1) {
      throw new Error(
        "'atob' failed: The string to be decoded is not correctly encoded.",
      );
    }

    let bc = 0,
      bs,
      buffer,
      idx = 0;

    for (
      ;
      (buffer = str.charAt(idx++));
      ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
        ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
        : 0
    ) {
      buffer = chars.indexOf(buffer);
    }

    return output;
  }

  decodeProcessedEpisodeData(encoded) {
    const [part1_b64, part2_b64] = encoded.split(".");
    const part1 = this.atob_polyfill(part1_b64);
    const part2 = this.atob_polyfill(part2_b64);

    let result = "";
    for (let i = 0; i < part1.length; i++) {
      const c1 = part1.charCodeAt(i);
      const c2 = part2.charCodeAt(i % part2.length);
      result += String.fromCharCode(c1 ^ c2);
    }

    return JSON.parse(result);
  }

  async getDetail(url) {
    const res = await new Client().get(url);
    const doc = new Document(res.body);

    const imageUrl = doc.selectFirst("img.thumbnail")?.getSrc;
    const details = doc.selectFirst("div.anime-details");

    const title = details.selectFirst("h1")?.text.trim();
    const genre = details.select("ul.anime-genres a").map((e) => e.text.trim());
    const description = [
      details.selectFirst("p.anime-story")?.text.trim(),
      "",
      ...details.select("div.anime-info").map((el) => {
        const label = el.selectFirst("span")?.text.trim();
        const value = el.text.replace(label, "").trim();
        return `• ${label} ${value}`;
      }),
    ].join("\n");

    const status = this.toStatus(
      details.selectFirst("div.anime-info:contains(حالة الأنمي)")?.text,
    );

    const chapters = this.decodeProcessedEpisodeData(
      doc
        .selectFirst("script:contains('processedEpisodeData')")
        ?.text?.match(/processedEpisodeData\s*=\s*'([^']+)'/)[1],
    )?.map((entry) => this.chapterFromJson(entry));

    return {
      title,
      imageUrl,
      description,
      genre,
      status,
      chapters,
    };
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
