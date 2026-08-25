#!/usr/bin/env python3
"""
build.py — gera dist/calculozero.html

Lê o index.html, substitui cada <link rel="stylesheet"> e <script src="...">
pelo conteúdo do arquivo, e escreve um único HTML autocontido.

Por que existe: o projeto é organizado em módulos separados (bom para
manutenção), mas um arquivo único é o que se abre em qualquer lugar sem
servidor — inclusive num celular.

Uso:  python3 build.py
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "index.html"
OUT_DIR = ROOT / "dist"
OUT = OUT_DIR / "calculozero.html"

LINK_RE = re.compile(r'[ \t]*<link[^>]*?href="([^"]+\.css)"[^>]*?>\s*\n?')
SCRIPT_RE = re.compile(r'[ \t]*<script[^>]*?src="([^"]+\.js)"[^>]*?>\s*</script>\s*\n?')
COMMENT_RE = re.compile(r"[ \t]*<!--(?!\[if)(?:(?!-->).)*-->\s*\n?", re.S)


def read(rel: str) -> str:
    path = ROOT / rel
    if not path.exists():
        sys.exit(f"ERRO: arquivo referenciado não existe: {rel}")
    return path.read_text(encoding="utf-8")


def inline_css(match: re.Match) -> str:
    return f"<style>\n{read(match.group(1))}\n</style>\n"


def inline_js(match: re.Match) -> str:
    return f"<script>\n{read(match.group(1))}\n</script>\n"


def main() -> None:
    html = SRC.read_text(encoding="utf-8")

    css_count = len(LINK_RE.findall(html))
    js_count = len(SCRIPT_RE.findall(html))

    html = LINK_RE.sub(inline_css, html)
    html = SCRIPT_RE.sub(inline_js, html)
    html = COMMENT_RE.sub("", html)

    OUT_DIR.mkdir(exist_ok=True)
    OUT.write_text(html, encoding="utf-8")

    size_kb = OUT.stat().st_size / 1024
    print(f"OK  {css_count} CSS + {js_count} JS  ->  {OUT.relative_to(ROOT)}  ({size_kb:.0f} KB)")


if __name__ == "__main__":
    main()
