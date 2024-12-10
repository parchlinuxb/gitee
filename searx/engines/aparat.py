"""
 Aparat (Videos)
"""

import time
from json import loads
from dateutil import parser

# from urllib.parse import urlencode
# from searx.exceptions import SearxEngineAPIException
from urllib.parse import quote_plus

# import json
# from datetime import datetime
# from urllib.parse import urlencode, urljoin, urlparse

# about
about = {
    "website": "https://www.aparat.com/",
    "wikidata_id": "Q16045816",
    "official_api_documentation": "https://www.aparat.com/api",
    "use_official_api": True,
    "require_api_key": False,
    "results": "JSON",
}

# engine dependent config
categories = ["videos"]
paging = True
language_support = False
number_of_results = 10

# search-url
base_url = "https://www.aparat.com/etc/api/videoBySearch/"
search_url = base_url + "text/{query}/perpage/{number_of_results}/curoffset/{page}"
base_aparat_url = "https://www.aparat.com/v/"


# do search-request
def request(query, params):
    pageno = params["pageno"] * (number_of_results - 1)
    params["url"] = search_url.format(
        query=quote_plus(query), number_of_results=number_of_results, page=pageno
    )

    return params


# get response from search-request
def response(resp):
    results = []

    search_results = loads(resp.text)

    # return empty array if there are no results
    if "videobysearch" not in search_results:
        return []

    # parse results
    for result in search_results.get("videobysearch", {}):
        videoid = result["uid"]

        thumbnail = ""

        pubdate = result["create_date"]
        publishedDate = parser.parse(pubdate)

        length = time.gmtime(result["duration"])
        if length.tm_hour:
            length = time.strftime("%H:%M:%S", length)
        else:
            length = time.strftime("%M:%S", length)

        thumbnail = result["small_poster"]

        url = base_aparat_url + videoid

        # append result
        results.append(
            {
                "url": url,
                "title": result["title"],
                "content": " ",
                "template": "videos.html",
                "length": length,
                "publishedDate": publishedDate,
                "iframe_src": result["frame"],
                "author": result["username"],
                "thumbnail": thumbnail,
            }
        )

    # return results
    return results
