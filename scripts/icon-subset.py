"""Subset the three vendor icon-font stylesheets to the icons the site uses.

The icon *fonts* are already subsetted to the glyphs in use (see CLAUDE.md), but
the vendor CSS still lists every icon class (~270KB). This writes slim siblings
next to each vendor file:

    bootstrap-icons.min.css -> bootstrap-icons.subset.min.css
    boxicons.min.css        -> boxicons.subset.min.css
    remixicon.min.css       -> remixicon.subset.min.css

A rule is kept when it has no class selector (base/attribute rules such as
`[class^=ri-]`) or when one of its classes appears as a word in index.html,
assets/js or the editable assets/css sources. Dead font sources (.eot/.ttf/.svg,
which are not shipped) are dropped from @font-face.

Run after adding an icon class:  python scripts/icon-subset.py  (or: npm run build)
Remember the font files themselves must also contain the new glyph (CLAUDE.md).
"""
import glob
import os
import re

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

VENDORS = [
    'assets/vendor/bootstrap-icons/bootstrap-icons',
    'assets/vendor/boxicons/css/boxicons',
    'assets/vendor/remixicon/remixicon',
]

WORD = re.compile(r'[A-Za-z0-9_-]+')
CLASS_TOKEN = re.compile(r'\.(-?[A-Za-z_][A-Za-z0-9_-]*)')
SRC_ENTRY = re.compile(r'url\(\s*(["\']?)([^)"\']*)\1\s*\)\s*format\(\s*["\']?([\w-]+)["\']?\s*\)')


def used_words():
    paths = ['index.html']
    paths += glob.glob('assets/js/**/*.js', recursive=True)
    paths += [p for p in glob.glob('assets/css/*.css') if not p.endswith('.min.css')]
    words = set()
    for path in paths:
        with open(path, encoding='utf-8') as f:
            words.update(WORD.findall(f.read()))
    return words


def split_top_level(css):
    """Yield (prefix, body, kind): top-level comments, blocks and at-rules."""
    i, n = 0, len(css)
    while i < n:
        if css.startswith('/*', i):
            j = css.index('*/', i) + 2
            yield css[i:j], None
            i = j
            continue
        brace = css.find('{', i)
        if brace == -1:
            break
        depth, j = 1, brace + 1
        while j < n and depth:
            depth += {'{': 1, '}': -1}.get(css[j], 0)
            j += 1
        yield css[i:brace], css[brace + 1:j - 1]
        i = j


def rewrite_font_face(body):
    entries = [(u, f) for _, u, f in SRC_ENTRY.findall(body) if f in ('woff2', 'woff')]
    assert entries, 'no woff/woff2 source found in @font-face'
    src = ','.join('url("%s") format("%s")' % e for e in entries)
    rest = re.sub(r'src:[^;]*(?:;|$)', '', body)  # drops every src declaration
    return rest.rstrip(';') + (';' if rest.strip() else '') + 'src:' + src


def subset(path, words):
    with open(path + '.min.css', encoding='utf-8') as f:
        css = f.read()
    out, kept, total = [], 0, 0
    for prefix, body in split_top_level(css):
        if body is None:  # comment (licence header)
            out.append(prefix)
            continue
        total += 1
        sel = prefix.strip()
        if sel.startswith('@font-face'):
            out.append('@font-face{%s}' % rewrite_font_face(body))
            kept += 1
        elif re.match(r'@(-\w+-)?keyframes\s', sel):
            if sel.split()[-1] in words:  # animation names are referenced as words
                out.append('%s{%s}' % (sel, body))
                kept += 1
        elif sel.startswith('@'):
            out.append('%s{%s}' % (sel, body))
            kept += 1
        else:
            classes = CLASS_TOKEN.findall(sel)
            if not classes or any(c in words for c in classes):
                out.append('%s{%s}' % (sel, body))
                kept += 1
    target = path + '.subset.min.css'
    with open(target, 'w', encoding='utf-8', newline='') as f:
        f.write(''.join(out))
    print('%-58s %3d/%4d rules  %6d -> %5d bytes' % (target, kept, total, len(css), os.path.getsize(target)))


if __name__ == '__main__':
    words = used_words()
    for vendor in VENDORS:
        subset(vendor, words)
