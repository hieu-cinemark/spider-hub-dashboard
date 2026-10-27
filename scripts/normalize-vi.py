#!/usr/bin/env python3
"""Chuan hoa tu vung tieng Viet cho dashboard.

Quy uoc cua dashboard (xem comment o dau file translations.ts):
  crawl / crawler / cao  -> "thu thap"
  job                   -> "viec"
  ingest                -> "xu ly du lieu"
  checkpoint            -> "gian doan"
  session / token       -> "phien" / "ma truy cap"
  log / logs            -> "nhat ky"

Latin words are swapped with word boundaries, so "login" never becomes
"nhat kyi n" and "sessionid"/"msToken" are left alone.

QUAN TRONG: placeholder trong template khong duoc chuyen doi. Mot script
truoc day da bien "{account}" thanh "{tai khoan}", lam `t()` khong noi duoc
gia tri - man hinh hien ra "Tai khoan: {tai khoan}". Phan gia tri (noi
dung tieng Viet) va phan placeholder duoc tach rieng: chi phan noi dung
tieng Viet moi duoc thay the.
"""
import re
import sys

PATH = 'src/i18n/translations.vi.ts'

# Latin -> Vietnamese, applied with \b boundaries (first letter case preserved).
LATIN = [
    (r'crawler', 'bộ thu thập'),
    (r'crawl', 'thu thập'),
    (r'jobs', 'việc'),
    (r'job', 'việc'),
    (r'ingest', 'xử lý dữ liệu'),
    (r'checkpoint', 'gián đoạn'),
    (r'messages', 'tin nhắn'),
    (r'message', 'tin nhắn'),
    (r'session', 'phiên'),
    (r'token', 'mã truy cập'),
    (r'classifier', 'bộ phân loại'),
    (r'account', 'tài khoản'),
    (r'provider', 'nhà cung cấp'),
    (r'candidate', 'ứng viên'),
    (r'scheduler', 'bộ lập lịch'),
    (r'traffic', 'lưu lượng'),
    (r'dispatch', 'gửi'),
    (r'publish', 'gửi'),
    (r'logs', 'nhật ký'),
    (r'log', 'nhật ký'),
]

# Vietnamese-only phrases, applied verbatim (no boundary worries).
PHRASES = [
    ('Cào ngay', 'Thu thập ngay'),
    ('Đang cào', 'Đang thu thập'),
    ('đã cào', 'đã thu thập'),
    ('đang cào', 'đang thu thập'),
    ('được cào', 'được thu thập'),
    ('cào bảng tin', 'thu thập bảng tin'),
    ('lượt cào', 'lượt thu thập'),
    ('xếp hàng cào', 'xếp hàng thu thập'),
    ('cào ít trang', 'thu thập ít trang'),
    ('cào thưa', 'thu thập thưa'),
    ('tự cào', 'tự thu thập'),
    ('cào liên tục', 'thu thập liên tục'),
    ('cào ngay', 'thu thập ngay'),
    ('cào hết', 'thu thập hết'),
    ('cào bình luận', 'thu thập bình luận'),
    ('cào video', 'thu thập video'),
    ('cào hashtag', 'thu thập hashtag'),
    ('cào', 'thu thập'),
    ('Cào', 'Thu thập'),
    ('Phễu ingest', 'Phễu xử lý dữ liệu'),
    ('lúc ingest', 'lúc xử lý dữ liệu'),
    ('vào ingest', 'được xử lý'),
    ('Fire một', 'Chạy một'),
    ('fire một', 'chạy một'),
    ('query các', 'tìm các'),
    ('pick up', 'nhận'),
    ('restart', 'khởi động lại'),
    ('Restart', 'Khởi động lại'),
]

LATIN_MAP = {w: v for w, v in LATIN}
LATIN_RE = re.compile(r'\b(' + '|'.join(w for w, _ in LATIN) + r')\b', re.IGNORECASE)

# `{ten}` - placeholder, bao giong chu "placeholder" de khong bao gio bi thay.
PLACEHOLDER_RE = re.compile(r'\{[A-Za-z_][A-Za-z0-9_]*\}')


def swap_latin(text: str) -> str:
    def repl(m: re.Match) -> str:
        word = m.group(0)
        out = LATIN_MAP[word.lower()]
        if word[0].isupper():
            return out[0].upper() + out[1:]
        return out

    return LATIN_RE.sub(repl, text)


def swap_text(text: str) -> str:
    """Chi doi chuoi noi dung tieng Viet, giu nguyen placeholder."""
    # Tach placeholder ra, chi xu ly phan con lai, roi ghep lai.
    holes: list[str] = []

    def stash(m: re.Match) -> str:
        holes.append(m.group(0))
        return f'\x00{len(holes) - 1}\x00'

    body = PLACEHOLDER_RE.sub(stash, text)
    body = swap_latin(body)
    for old, new in PHRASES:
        body = body.replace(old, new)
    for i, hole in enumerate(holes):
        body = body.replace(f'\x00{i}\x00', hole)
    return body


def main() -> int:
    src = open(PATH, encoding='utf-8').read()

    def swap_value(m: re.Match) -> str:
        literal = m.group(2)
        quote = literal[0]
        body = literal[1:-1]
        body = swap_text(body)
        return m.group(1) + quote + body + quote

    out = re.sub(r'(\w+:\s*)("(?:[^"\\]|\\.)*")', swap_value, src)
    open(PATH, 'w', encoding='utf-8').write(out)
    print('done')
    return 0


if __name__ == '__main__':
    sys.exit(main())
