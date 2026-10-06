"""Build the single-file prototype: python3 scripts/build.py -> dist/index.html"""
from pathlib import Path
root = Path(__file__).resolve().parent.parent
src = root / "src"
read = lambda p: (src / p).read_text(encoding="utf-8")
css = read("styles/base.css") + "\n" + read("styles/workspace.css")
ui = read("ui/core.js") + "\n" + read("ui/workspace.js")
html = (read("index.html")
        .replace("__CSS__", css)
        .replace("__AFRICA__", read("data/africa.json"))
        .replace("__ENGINE__", read("engine.js"))
        .replace("__UI__", ui))
out = root / "dist" / "index.html"
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding="utf-8")
print(f"Built {out.relative_to(root)} ({len(html)//1024} KB)")
