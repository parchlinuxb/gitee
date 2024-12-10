"""
    Abadis (dictionary)
"""

from searx.utils import extract_text, eval_xpath
from lxml import html

about = {
    "website": "https://abadis.ir/",
    "wikidata_id": "Q56690821",
    "use_official_api": False,
    "require_api_key": False,
    "results": "HTML",
    "language": "fa",
}

categories = ["dictionaries"]
paging = False

BASE_URL = "https://abadis.ir/"


def request(query, params):

    # Detect language
    localLang = params["searxng_locale"]
    match localLang.split("-"):
        case [*_, "fa"] | [*_, "ar"]:
            localLang = "fatofa/"
        case [*_, "en"]:
            localLang = "entofa/"
        case _:
            localLang = False

    # Generate URL
    if localLang:
        global RESULT_URL
        RESULT_URL = BASE_URL + localLang + query
    else:
        return None

    params["url"] = RESULT_URL
    return params


def response(resp):
    results = []

    # Parse HTML
    dom = html.fromstring(resp.text)
    mainContent = eval_xpath(dom, "//main")

    for content in mainContent:

        # Check result language
        if eval_xpath(content, '//div[@id="pho"]'):
            # Get LTR Result
            WORD = eval_xpath(content, '//div[@id="boxWrd"]/div/h1')
            IPA = eval_xpath(content, '//div[@id="boxWrd"]/div[2]')
            CONTENT = eval_xpath(
                content, 'div[contains(@t, "انگلیسی به انگلیسی")]/div[2]/article'
            )
        else:
            # Get RTL Result
            WORD = eval_xpath(content, '//div[@id="boxWrd"]/h1')
            IPA = eval_xpath(content, '//div[@id="boxWrd"]/div')
            CONTENT = eval_xpath(content, 'div[contains(@t, "لغت نامه دهخدا")]/div[2]')

    # Generate Result
    results.append(
        {
            "template": "dictionaries.html",
            "url": RESULT_URL,
            "title": extract_text(WORD),
            "ipa": extract_text(IPA),
            "content": extract_text(CONTENT)[:150] + "...",
        }
    )

    return results
