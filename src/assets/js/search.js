(() => {
  const call = () => {
    const searchTerm = getQueryVariable('query')

    if (searchTerm) { populateSearchInputs(searchTerm) }

    const results = searchTerm ? generateIndex().search(searchTerm) : undefined

    displaySearchResults(results, searchTerm)
    setHeading(results?.length, searchTerm)
  }

  const getQueryVariable = (variable) => {
    const urlQueryString = window.location.search
    const urlParams = new URLSearchParams(urlQueryString)

    return urlParams.get(variable)
  }

  const populateSearchInputs = (searchTerm) => {
    const searchInputs = Array.from(document.getElementsByClassName('search-form__input'))

    searchInputs.forEach((searchFormInput) => {
      searchFormInput.setAttribute('value', searchTerm)
    })
  }

  const generateIndex = () => {
    const index = elasticlunr(function () {
      this.addField('title')
      this.addField('content')
      this.setRef('id')

      this.pipeline.remove(lunr.stemmer)
    })

    const pages = Object.entries(window.store)

    pages.forEach(([pageKey, page]) => {
      const content = formatContent(page.content)

      if (content === ' ') { return }

      window.store[pageKey].content = content

      index.addDoc({
        id: pageKey,
        title: page.title,
        content: page.content
      })
    })

    return index
  }

  const formatContent = (rawContent) => {
    return rawContent
      .replace(/([\.\?\!])[\n\s]{2,}/g, '$1 ')
      .replace(/[\n\s]{2,}/g, '. ')
      .replace(/\n/, ' ')
  }

  const displaySearchResults = (results, searchTerm) => {
    const searchResultsElement = document.getElementById('search-results')

    if (!searchTerm) {
      searchResultsElement.innerHTML = '<li class="search-results__no-results-message">Enter a search term in the box above</li>'
      return
    }

    if (!results.length) {
      searchResultsElement.innerHTML = '<li class="search-results__no-results-message">No results found</li>'
      return
    }

    let innerHtml = ''

    results.forEach((result) => {
      const item = window.store[result.ref]

      const breadcrumbs = item.url
        .replace('.html', '')
        .replace(/-/g, ' ')
        .split('/')
        .filter(i => i)
        .map(breadcrumb => breadcrumb[0].toUpperCase() + breadcrumb.substring(1))

      breadcrumbs.pop()

      const breadcrumbsString = breadcrumbs.join(' > ')

      const matchesRegex = new RegExp(searchTerm, 'gi')
      const matchCount = item.content.match(matchesRegex)?.length || 0
      const matchCountLabel = matchCount === 1 ? 'match' : 'matches'

      const excerpt = getExcerpt(item.content, searchTerm)

      innerHtml +=
        '<li class="search-results__result">' +
          `<a href="${item.url}">` +
            `<h3 class="search-results__result-title">${item.title}</h3>` +
          '</a>' +
          '<div class="search-results__result-meta">' +
            `<span>${breadcrumbsString}</span>` +
            `<span>${matchCount} ${matchCountLabel}</span>` +
          '</div>' +
          `<p class="search-results__result-excerpt">...${excerpt}...</p>` +
        '</li>'
    })

    searchResultsElement.innerHTML = innerHtml
  }

  const getExcerpt = (content, query) => {
    const queryRegex = new RegExp(query, 'i')
    const searchIndex = content.search(queryRegex)
    const queryLength = query.length
    const excerpt = content.slice(
      getStartIndex(searchIndex, content),
      getEndIndex(searchIndex, queryLength, content)
    )

    return excerpt.replace(
      queryRegex,
      "<strong class='search-results__matching-keyword'>$&</strong>"
    )
  }

  const getStartIndex = (searchIndex, content) => {
    let startIndex = Math.max(searchIndex - 100, 0)

    while (startIndex > 0 && content[startIndex] !== ' ') {
      startIndex = startIndex - 1
    }

    if (content[startIndex] === ' ') { startIndex++ }

    return startIndex
  }

  const getEndIndex = (searchIndex, queryLength, content) => {
    let endIndex = Math.min(searchIndex + queryLength + 100, content.length)

    while (endIndex !== content.length && content[endIndex] !== ' ') {
      endIndex++
    }

    return endIndex
  }

  const setHeading = (resultsCount, searchTerm) => {
    const searchHeading = document.getElementById('search-heading')

    if (!searchTerm) {
      searchHeading.innerText = 'Enter a search term'
      return
    }

    const resultsLabel = resultsCount === 1 ? 'result' : 'results'

    searchHeading.innerText = `Showing ${resultsCount} ${resultsLabel} for "${searchTerm}"`
  }

  call()
})()
