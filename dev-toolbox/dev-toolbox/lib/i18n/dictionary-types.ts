/** Shape every locale dictionary must satisfy. Defined once so TypeScript
 *  catches missing or mistyped translations at build time — if ru.ts is
 *  missing a key, `next build` fails instead of silently falling back. */
export interface Dictionary {
  site: {
    tagline: string;
    description: string;
  };
  nav: {
    tools: string;
    categories: string;
    ai: string;
    aiSoon: string;
    startUsingTools: string;
  };
  badges: {
    popular: string;
    comingSoon: string;
    pro: string;
  };
  home: {
    headline: string;
    subheadline: string;
    tryItNote: string;
    popularToolsHeading: string;
    categoriesHeading: string;
    aiHeading: string;
    aiComingSoon: string;
    aiDescription: string;
  };
  heroDemo: {
    ariaLabel: string;
    placeholderComment: string;
  };
  footer: {
    tagline: string;
    categoriesHeading: string;
    productHeading: string;
    companyHeading: string;
    allTools: string;
    aiToolsComingSoon: string;
    documentation: string;
    privacyPolicy: string;
    terms: string;
    contact: string;
    copyrightNote: string;
  };
  auth: {
    signIn: string;
    signUp: string;
    signOut: string;
    profile: string;
    email: string;
    password: string;
    confirmPassword: string;
    forgotPassword: string;
    forgotPasswordLink: string;
    resetPassword: string;
    sendResetLink: string;
    resetLinkSent: string;
    noAccount: string;
    hasAccount: string;
    continueWith: string;
    continueWithGoogle: string;
    continueWithGithub: string;
    orDivider: string;
    signingIn: string;
    signingUp: string;
    sending: string;
    passwordsNoMatch: string;
    checkEmail: string;
    profileHeading: string;
    memberSince: string;
    plan: string;
    planFree: string;
    planPro: string;
    toolUsageHeading: string;
    noUsageYet: string;
    deleteAccount: string;
    savedSnippetsHeading: string;
    noSnippetsYet: string;
    usageCount: string;
    lastUsed: string;
    emailLabel: string;
    displayName: string;
    saveChanges: string;
    saving: string;
    saved: string;
  };
  toolsIndexPage: {
    metaTitle: string;
    metaDescription: string;
    heading: string;
    description: string;
  };
  categoryPage: {
    home: string;
    toolsSuffix: string;
  };
  toolLayout: {
    home: string;
    howToUseHeading: string;
    faqHeading: string;
    relatedToolsHeading: string;
  };
  comingSoon: {
    body: string;
    emailPlaceholder: string;
    notifyMe: string;
    thanks: string;
  };
  common: {
    copy: string;
    copied: string;
    download: string;
    input: string;
    output: string;
    generate: string;
  };
  tools: {
    jsonFormatter: {
      format: string;
      minify: string;
      indent: string;
      tab: string;
      placeholder: string;
      invalidPrefix: string;
    };
    jsonValidator: {
      loadValidExample: string;
      loadInvalidExample: string;
      placeholder: string;
      emptyHint: string;
      validHeading: string;
      validSummaryPrefix: string;
      invalidHeading: string;
      aroundLine: string;
      /** Patterns: use {count} as placeholder, component replaces it */
      describeArrayPattern: string;
      describeArraySuffix1: string;
      describeArraySuffixN: string;
      describeObjectPattern: string;
      describeObjectSuffix1: string;
      describeObjectSuffixN: string;
      describeNull: string;
      describeTypeofString: string;
      describeTypeofNumber: string;
      describeTypeofBoolean: string;
    };
    base64: {
      encode: string;
      decode: string;
      plainText: string;
      base64Label: string;
      invalidInput: string;
    };
    uuid: {
      howMany: string;
      uppercase: string;
      hyphens: string;
      generate: string;
      copyAll: string;
    };
    jwt: {
      label: string;
      threePartsError: string;
      decodeError: string;
      header: string;
      payload: string;
      expired: string;
      expires: string;
      note: string;
    };
    timestamp: {
      timestampLabel: string;
      now: string;
      local: string;
      utc: string;
      iso: string;
      enterTimestampHint: string;
      dateLabel: string;
      seconds: string;
      milliseconds: string;
      pickDateHint: string;
    };
    urlEncode: {
      encode: string;
      decode: string;
      componentCheckbox: string;
      invalidInput: string;
    };
    password: {
      length: string;
      lower: string;
      upper: string;
      digits: string;
      symbols: string;
      generate: string;
      strengthPrefix: string;
      weak: string;
      fair: string;
      strong: string;
      veryStrong: string;
    };
    curl: {
      urlPlaceholder: string;
      headersLabel: string;
      addHeader: string;
      headerNamePlaceholder: string;
      valuePlaceholder: string;
      removeHeaderAria: string;
      bodyLabel: string;
      commandLabel: string;
    };
    xml: {
      indent: string;
      placeholder: string;
      invalidPrefix: string;
      invalidMessage: string;
    };
    html: {
      indent: string;
      note: string;
    };
    regex: {
      patternLabel: string;
      flagGlobal: string;
      flagIgnoreCase: string;
      flagMultiline: string;
      flagDotAll: string;
      testStringLabel: string;
      /** "{count}" is replaced by the component */
      matchCountPattern: string;
      matchCountSuffix1: string;
      matchCountSuffixN: string;
      atIndex: string;
      groupsLabel: string;
    };
    headerInspector: {
      urlPlaceholder: string;
      inspect: string;
      checking: string;
      note: string;
      networkError: string;
      invalidBody: string;
      invalidUrl: string;
      blockedHost: string;
      requestFailedPrefix: string;
    };
    sqlFormatter: {
      placeholder: string;
      format: string;
      minify: string;
      invalidPrefix: string;
      dialectLabel: string;
      dialects: {
        sql: string;
        mysql: string;
        postgresql: string;
        sqlite: string;
        tsql: string;
      };
    };
    fakeData: {
      generateLabel: string;
      generate: string;
      countLabel: string;
      formatLabel: string;
      formats: { json: string; csv: string; sql: string };
      fields: {
        name: string;
        email: string;
        phone: string;
        address: string;
        company: string;
        username: string;
        uuid: string;
        date: string;
        number: string;
        boolean: string;
      };
      copyAll: string;
      download: string;
      noFieldsHint: string;
    };
    xpathGenerator: {
      htmlLabel: string;
      htmlPlaceholder: string;
      generate: string;
      resultsLabel: string;
      absolute: string;
      relative: string;
      byId: string;
      byClass: string;
      copyAll: string;
      emptyHint: string;
    };
    cssSelectorGenerator: {
      htmlLabel: string;
      htmlPlaceholder: string;
      generate: string;
      resultsLabel: string;
      copyAll: string;
      emptyHint: string;
    };
    apiBuilder: {
      methodLabel: string;
      urlPlaceholder: string;
      headersLabel: string;
      addHeader: string;
      headerName: string;
      headerValue: string;
      removeHeader: string;
      paramsLabel: string;
      addParam: string;
      paramName: string;
      paramValue: string;
      removeParam: string;
      bodyLabel: string;
      contentTypeLabel: string;
      send: string;
      sending: string;
      requestPreviewLabel: string;
      responseLabel: string;
      statusLabel: string;
      timeLabel: string;
      responseBodyLabel: string;
      corsNote: string;
    };
    restBuilder: {
      methodLabel: string;
      urlPlaceholder: string;
      headersLabel: string;
      addHeader: string;
      headerName: string;
      headerValue: string;
      removeHeader: string;
      bodyLabel: string;
      send: string;
      sending: string;
      responseLabel: string;
      statusLabel: string;
      timeMs: string;
      copyResponse: string;
      corsNote: string;
    };
  };
  pages: {
    docs: {
      heading: string;
      intro: string;
      toolsByCategoryHeading: string;
      toolsSuffix: string;
      howItWorksHeading: string;
      howItWorksBody: string;
      apiHeading: string;
      apiBody: string;
      aiHeading: string;
      aiBodyPrefix: string;
      aiBodyLinkText: string;
      aiBodySuffix: string;
    };
    privacy: {
      heading: string;
      lastUpdated: string;
      shortVersionHeading: string;
      shortVersionBody: string;
      analyticsHeading: string;
      analyticsBody: string;
      accountsHeading: string;
      accountsBody: string;
      contactHeading: string;
      contactBodyPrefix: string;
      contactLinkText: string;
      disclaimer: string;
    };
    terms: {
      heading: string;
      lastUpdated: string;
      usingToolsHeading: string;
      usingToolsBody: string;
      acceptableUseHeading: string;
      acceptableUseBody: string;
      noWarrantyHeading: string;
      noWarrantyBody: string;
      changesHeading: string;
      changesBody: string;
      disclaimer: string;
    };
    contact: {
      heading: string;
      bodyPrefix: string;
      bodySuffix: string;
      requestsBody: string;
    };
  };
}
