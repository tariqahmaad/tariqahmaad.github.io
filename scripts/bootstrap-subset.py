"""Subset bootstrap.min.css to the classes actually used by index.html.

Run this AFTER adding new Bootstrap classes to index.html or to the scripts in
assets/js (classes toggled from JavaScript, e.g. `d-block`, are picked up too):
    python scripts/bootstrap-subset.py        (or: bash scripts/minify.sh)
then re-minify with esbuild (scripts/minify.sh does both).
The original bootstrap.min.css is kept untouched as the source.
"""
import glob
import os
import re

# Work from the repository root regardless of where the script is launched.
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

SRC = 'assets/vendor/bootstrap/css/bootstrap.min.css'
OUT = 'assets/vendor/bootstrap/css/bootstrap.subset.min.css'

with open('index.html', encoding='utf-8') as f:
    html = f.read()

used = set()
for m in re.finditer(r'class="([^"]*)"', html):
    used.update(m.group(1).split())

# Classes applied from JavaScript: classList.add/remove/toggle/contains('x', ...)
# and class="..." attributes inside JS template strings.
CLASSLIST_CALL = re.compile(r'classList\.(?:add|remove|toggle|contains|replace)\(([^)]*)\)')
QUOTED_TOKEN = re.compile(r"""["']([A-Za-z_][A-Za-z0-9_-]*)["']""")
js_tokens = set()
for path in glob.glob('assets/js/**/*.js', recursive=True):
    with open(path, encoding='utf-8') as f:
        js = f.read()
    for call in CLASSLIST_CALL.finditer(js):
        js_tokens.update(QUOTED_TOKEN.findall(call.group(1)))
    for attr in re.finditer(r'class="([^"$]*)"', js):
        js_tokens.update(attr.group(1).split())
used |= js_tokens
print('used class tokens:', len(used), '(%d from JS)' % len(js_tokens))

class_tok = re.compile(r'\.([A-Za-z_][A-Za-z0-9_-]*)')
attr_sel = re.compile(r'\[\s*(data-bs-[a-z-]+)')

def rule_selector(sel):
    if attr_sel.search(sel):
        return True
    toks = set(class_tok.findall(sel))
    if not toks:
        return True
    return bool(toks & used)

with open(SRC, encoding='utf-8') as f:
    css = f.read()

n = len(css)

def parse_block(css, i, out):
    while i < n:
        while i < n and css[i] in ' \t\r\n;':
            i += 1
        if i >= n:
            break
        if css[i] == '}':
            return i + 1
        start = i
        depth = 0
        while i < n:
            c = css[i]
            if c == '"' or c == "'":
                q = c
                i += 1
                while i < n and css[i] != q:
                    i += 1
            elif c == '{':
                depth += 1
            elif c == '}':
                if depth == 0:
                    break
                depth -= 1
                if depth == 0:
                    i += 1
                    break
            i += 1
        rule = css[start:i]
        brace = rule.find('{')
        if brace == -1:
            continue
        prelude = rule[:brace].strip()
        if prelude.startswith('@'):
            if prelude.startswith(('@keyframes', '@-webkit-keyframes', '@charset', '@import')):
                out.append(rule)
            elif prelude.startswith(('@media', '@supports')):
                inner = []
                end = parse_block(css, start + brace + 1, inner)
                if inner:
                    out.append(prelude + '{' + ''.join(inner) + '}')
                i = max(i, end)
        else:
            sels = prelude.split(',')
            kept = [s for s in sels if rule_selector(s)]
            if kept:
                out.append(','.join(kept) + rule[brace:])
    return i

out = []
parse_block(css, 0, out)
result = ''.join(out)

with open(OUT, 'w', encoding='utf-8', newline='') as f:
    f.write(result)

kept_classes = set(class_tok.findall(result))
print('original bytes:', len(css))
print('subset bytes  :', len(result))
print('classes in subset:', len(kept_classes))
# Guard against silently dropping classes that the page relies on.
REQUIRED = ['container', 'row', 'd-block', 'is-invalid']
missing = [c for c in REQUIRED if c not in kept_classes]
assert not missing, 'required Bootstrap classes missing from subset: %s' % missing
print('sanity: required classes present')
