#!/bin/env python3

import base64
from playwright.sync_api import sync_playwright
from lxml import etree
import re
import os
import requests
import sys
import subprocess
import uuid


if sys.argv[1] == "--help" or sys.argv[1] == "-h":
    print(f"""
          {__file__} [flippingbook.com book id]
          cd tmp/pdf
          pdfunite * ../output.pdf
          rm -rf tmp
    """)
    sys.exit(1)


def mkdir(path):
    if os.path.exists(path) and not os.path.isdir(path):
        print(f"{path} existe e não é uma pasta, erro cruel")
        sys.exit(1)
    elif not os.path.exists(path):
        os.makedirs(path, exist_ok=True)


if os.getenv("XDG_DATA_HOME"):
    fonts_dir = f"{os.getenv('XDG_DATA_HOME')}/fonts/tmp"
else:
    fonts_dir = f"{os.getenv('HOME')}/.fonts/tmp"

for i in [fonts_dir, "./tmp/pages", "./tmp/pdf", "./tmp/fonts"]:
    mkdir(i)

book_id = sys.argv[1]

foundImage = False
imageUrl = ""

foundSvg = False
svgUrl = ""

fontForgeScript = """Open($1,1)
SetFontNames($3,$3,$3)
SetTTFName(0x409,3,$3)
Generate($2)
"""

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:113.0) Gecko/20100101 Firefox/113.0'
}


def is_page(url):
    global foundImage, foundSvg, svgUrl, imageUrl

    if "Policy" in url and "common" in url:
        foundSvg = True
        foundImage = True

        imageUrl = re.sub(r"(?<=/common/).*(?=\?Policy)",
                          "pages/html5substrates/page0001_4.jpg", url)

        svgUrl = re.sub(r"(?<=/common/).*(?=\?Policy)",
                        "pages/vector/0001.svg", url)


def processImage(name, url):
    filename = f"./tmp/pages/{name}"

    os.makedirs(os.path.dirname(filename), exist_ok=True)

    if not os.path.isfile(filename) or os.path.getsize(filename) == 0:
        print(url)
        print(filename)

        with open(filename, "wb") as file:
            response = requests.get(url)
            file.write(response.content)


def processSvg(filename, url):
    file = requests.get(url)

    if file.status_code != 200:
        return

    svg = file.text
    path = f"./tmp/pages/{filename}"

    if not os.path.isfile(path) or os.path.getsize(path) == 0:
        print(url)
        print(path)

        fonts = re.findall(r'@font-face \{.*?\}', svg)
        font_files = list()

        for font in fonts:
            name = re.search(r'font-family: "(.*?)"', font).group(1)
            data = re.search(
                r'src: url\(data:font/woff;base64,(.*?)\);', font).group(1)
            payload = base64.b64decode(data.encode('utf-8'))

            with open(f'tmp/fonts/{name}.woff', 'wb') as outf:
                outf.write(payload)

            # Generate a random name to bypass caching
            tname = str(uuid.uuid4())

            # print('Extracting font {}'.format(tname))

            svg = svg.replace(font, '')
            svg = svg.replace('"' + name + '"', '"' + tname + '"')

            p = subprocess.Popen(
                ['fontforge', '-script', '-', f'tmp/fonts/{name}.woff',
                 f'{fonts_dir}/{name}.ttf', tname],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                encoding='utf-8',
            )
            p.communicate(fontForgeScript)
            # subprocess.run()

            font_files.append(f'{fonts_dir}/{name}.ttf')
            os.remove(f'tmp/fonts/{name}.woff')

        with open('tmp/svgfile.svg', 'w') as f:
            print(svg, file=f)

        subprocess.run(
            ['org.inkscape.Inkscape', '--export-type=pdf', f'--export-filename={path}', 'tmp/svgfile.svg'])

        for font_file in font_files:
            os.remove(font_file)

        os.remove('tmp/svgfile.svg')


def merge(bgName, textName, pageId):
    # print(bgPath, textPath)
    bgPdfPath = './tmp/bgfile.pdf'
    destination = f'./tmp/pdf/page{pageId}.pdf'

    bgPath = f'./tmp/pages/{bgName}'
    textPath = f'./tmp/pages/{textName}'

    if not os.path.isfile(destination) or os.path.getsize(destination) == 0:
        subprocess.run(['convert', bgPath, bgPdfPath])

        if not os.path.isfile(textPath):
            subprocess.run(['cp', bgPdfPath, destination])
        else:
            subprocess.run(['qpdf', '--underlay', bgPdfPath,
                            '--', textPath, destination])

        os.remove(bgPdfPath)


def run(playwright):
    global headers, foundSvg, foundImage

    browser = p.chromium.launch(headless=False)
    context = browser.new_context(extra_http_headers=headers)

    page = context.new_page()
    page.on("response", lambda response: is_page(
        response.url))

    page.goto(f"https://online.flippingbook.com/view/{book_id}/")

    html = etree.HTML(page.content())

    last = html.xpath('//link[@rel="last"]/@href')
    if len(last) == 0:
        sys.exit(1)

    bookLength = re.search(r'(?<=/)\d+(?=/$)', last[0]).group()

    while not foundSvg and not foundImage:
        # print(foundImage, foundSvg)
        pass

    browser.close()
    print("fechou o browser")

    for i in range(int(bookLength)):
        pageId = f"{(i+1):04}"
        print(pageId)

        imgurl = re.sub(r"\d+(?=_4\.jpg)", pageId, imageUrl)
        imageName = f"{pageId}-bg.jpg"
        # print(imgurl)

        svgurl = re.sub(r"\d+(?=\.svg)", pageId, svgUrl)
        svgName = f"{pageId}-text.pdf"
        # print(svgurl)

        processImage(imageName, imgurl)
        processSvg(svgName, svgurl)

        merge(imageName, svgName, pageId)


with sync_playwright() as p:
    # for line in stdin:
    run(p)
