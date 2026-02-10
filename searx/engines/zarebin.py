from urllib.parse import quote_plus

# about
about = {
    "website": 'https://zarebin.ir/',
    "wikidata_id": 'Q16045816',
    "official_api_documentation": '',
    "use_official_api": True,
    "require_api_key": False,
    "results": 'JSON',
}

# engine dependent config
categories = ['web']
paging = True
language_support = False
number_of_results = 10


# search-url
base_url = 'https://zarebin.ir/gse/api/'
search_url = base_url + 'search?q={query}&pl=0&page={page}&ldi=0&user_device=d&limit={number_of_results}&enable_smart_answers=true&qsrc=normal'


# do search-request
def request(query, params):
    params['url'] = search_url.format(query=quote_plus(query), number_of_results=number_of_results, page=params["pageno"])
    params['User-Agent'] = "Mozilla/5.0"
    return params


# get response from search-request
def response(resp):
    if resp.status_code != 200:
        raise Exception(f"HTTP {resp.status_code}")

    content_type = resp.headers.get("content-type", "")
    if "json" not in content_type:
        raise Exception("Response is not JSON")

    try:
        search_results = resp.json()
    except ValueError as e:
        raise Exception("Invalid JSON from zarebin") from e

    results = []

    search_results = resp.json()
    webs = (
    search_results.get("result", {})
        .get("all", {})
        .get("results", {})
        .get("webs", [])
    )


    # parse results
    for result in webs:
        # append result
        results.append(
            {
                'url': result.get('web_link'),
                'title': result.get('title'),
                'content': result.get('description'),
            }
        )

    # return results
    return results
