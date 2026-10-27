#!/usr/bin/env python3
"""Pass 2: clean up the leftovers the generic Latin swap could not phrase.

Everything here is a whole-sentence rewrite, done on the Vietnamese block
only, and each entry is matched verbatim so an already-updated string is
reported instead of being mangled.
"""
import re
import sys

PATH = 'src/i18n/translations.ts'
MARKER = 'const vi: Record<keyof typeof en, string> = {'

EXACT = [
    ('autoLoginDesc',
     '"Tự động đăng nhập lại các tài khoản có cookie hết hạn (phát hiện bởi spider-hub\'s cookie checker). Bật lên, chọn nền tảng, rồi bấm \'Chạy ngay\' để chạy một tick."',
     '"Tự động đăng nhập lại các tài khoản có cookie hết hạn (phát hiện bởi bộ kiểm tra cookie của spider-hub). Bật lên, chọn nền tảng, rồi bấm \'Chạy ngay\' để chạy một lượt."'),
    ('autoLoginRunNowHint',
     '"Chạy một tick ngay (tìm các tài khoản \'dead\' và gửi sang spider-hub)"',
     '"Chạy một lượt ngay (tìm các tài khoản bị đăng xuất và gửi sang spider-hub)"'),
    ('autoLoginRunningAlertDesc',
     '"Một tick đang gửi yêu cầu relogin sang spider-hub. Bảng lịch sử phía dưới sẽ tự refresh khi xong."',
     '"Một lượt đang gửi yêu cầu đăng nhập lại sang spider-hub. Bảng lịch sử phía dưới sẽ tự làm mới khi xong."'),
    ('autoLoginIntervalHelp',
     '"Bao lâu thì bộ lập lịch query một lần các tài khoản \'dead\' và gửi sang spider-hub. Mặc định 1h - chu kỳ ngắn hơn giúp nhận tài khoản vừa chết nhanh hơn nhưng tạo nhiều Kafka lưu lượng hơn."',
     '"Bao lâu thì bộ lập lịch tìm một lần các tài khoản bị đăng xuất và gửi sang spider-hub. Mặc định 1h - chu kỳ ngắn hơn giúp nhận tài khoản vừa chết nhanh hơn nhưng tạo nhiều lưu lượng Kafka hơn."'),
    ('autoLoginDryRunHelp',
     '"Nếu bật, tick vẫn query Supabase và gửi Kafka tin nhắn cho từng ứng viên, nhưng spider-hub sẽ tag dry_run=true và bỏ qua Playwright login thật. Bật cái này trước để xem run plan trước khi login thật chạy."',
     '"Nếu bật, lượt chạy vẫn tìm danh sách tài khoản và gửi tin nhắn Kafka cho từng ứng viên, nhưng spider-hub sẽ gắn dry_run=true và bỏ qua bước đăng nhập thật. Bật cái này trước để xem kế hoạch chạy trước khi đăng nhập thật."'),
    ('errorNoSavedSession',
     '"Tài khoản này không còn login đã lưu. Hãy dán cookie từ trình duyệt thật."',
     '"Tài khoản này không còn phiên đăng nhập đã lưu. Hãy dán cookie từ trình duyệt thật."'),
    ('importWithAiDesc',
     '"Mỗi tài khoản một dòng. Định dạng kiểu ID|PASS|MAIL|COOKIE tách ngay, không chờ AI. Chỉ mô tả tự do mới gọi AI (chậm)."',
     '"Mỗi tài khoản một dòng. Định dạng kiểu ID|PASS|MAIL|COOKIE tách ngay, không chờ AI. Chỉ mô tả tự do mới gọi AI (chậm)."'),
    ('autoLoginHistoryKafkaPublished', '"Đã gửi"', '"Đã gửi"'),
    ('autoLoginHistoryKafkaFailed', '"Gửi lỗi"', '"Gửi lỗi"'),
    ('columnUseForLogin', '"Cho login"', '"Dùng để đăng nhập"'),
    ('aiSettingsDesc',
     '"Tên model và system prompt dùng cho độ liên quan, cảm xúc, báo cáo, nhập tài khoản, lọc hashtag BFS và chẩn đoán tài khoản. Lưu xong lần gọi tiếp theo dùng ngay, không cần khởi động lại."',
     '"Tên model và system prompt dùng cho độ liên quan, cảm xúc, báo cáo, nhập tài khoản, lọc hashtag BFS và chẩn đoán tài khoản. Lưu xong lần gọi tiếp theo dùng ngay, không cần khởi động lại."'),
    ('kafkaLagHigh',
     '"Tin nhắn đang dồn - có thể consumer của hàng đợi này đã dừng"',
     '"Tin nhắn đang dồn - có thể bộ xử lý của hàng đợi này đã dừng"'),
    ('kafkaLagDesc',
     '"Số tin nhắn thật, chưa xử lý, đo trực tiếp từ Kafka - khác với danh sách hàng đợi bên dưới (có thể bị kẹt nếu một việc không bao giờ được nhận xử lý)."',
     '"Số tin nhắn thật, chưa xử lý, đo trực tiếp từ Kafka - khác với danh sách hàng đợi bên dưới (có thể bị kẹt nếu một việc không bao giờ được nhận xử lý)."'),
    ('confirmRelatedHashtagDesc',
     '"Thêm hashtag này thành từ khoá và xếp hàng thu thập BFS. Chỉ chạy sau khi bạn xác nhận."',
     '"Thêm hashtag này thành từ khoá và xếp hàng thu thập theo BFS. Chỉ chạy sau khi bạn xác nhận."'),
    ('sourcePagesDesc',
     '"Trang Facebook được thu thập bảng tin ở mỗi lượt thu thập theo lịch. Mỗi sáng AI duyệt các trang gợi ý và tự thêm trang của phim / trang chung. Trang của phim thu thập mỗi 6 giờ, mọi bài tính cho phim đó; trang chung (chuỗi rạp, trang review) thu thập mỗi 24 giờ, tự nhận phim theo nội dung từng bài. Trang không có bài mới thì thu thập thưa dần."',
     '"Trang Facebook được thu thập bảng tin ở mỗi lượt chạy theo lịch. Mỗi sáng AI duyệt các trang gợi ý và tự thêm trang của phim / trang chung. Trang của phim được thu thập mỗi 6 giờ, mọi bài tính cho phim đó; trang chung (chuỗi rạp, trang review) mỗi 24 giờ, tự nhận phim theo nội dung từng bài. Trang không có bài mới thì thu thập thưa dần."'),
    ('autoLoginTitle', '"Auto-login theo lịch"', '"Tự đăng nhập theo lịch"'),
    ('autoLoginRunningAlert', '"Auto-login đang chạy"', '"Tự đăng nhập đang chạy"'),
    ('toastAutoLoginSettingsUpdated', '"Đã cập nhật cài đặt auto-login"', '"Đã cập nhật cài đặt tự đăng nhập"'),
    ('toastAutoLoginStarted', '"Đã bắt đầu auto-login tick"', '"Đã bắt đầu một lượt tự đăng nhập"'),
    ('toastAutoLoginAlreadyRunning', '"Đang có một auto-login tick chạy rồi"', '"Đang có một lượt tự đăng nhập chạy rồi"'),
    ('autoLoginDryRun', '"Chạy thử (không login thật)"', '"Chạy thử (không đăng nhập thật)"'),
    ('importContentPlaceholder',
     '"user1|pass1|a@mail.com|mailpass|ttwid=...; sessionid=...\\nuser2|pass2|b@mail.com|mailpass|ttwid=...; sessionid=..."',
     '"user1|pass1|a@mail.com|mailpass|ttwid=...; sessionid=...\\nuser2|pass2|b@mail.com|mailpass|ttwid=...; sessionid=..."'),
]


def main() -> int:
    src = open(PATH, encoding='utf-8').read()
    idx = src.index(MARKER)
    head, vi = src[:idx], src[idx:]

    missing = []
    for key, old, new in EXACT:
        if old not in vi:
            missing.append(key)
            continue
        vi = vi.replace(old, new, 1)

    open(PATH, 'w', encoding='utf-8').write(head + vi)
    print('MISSING:', missing if missing else 'none')
    return 0


if __name__ == '__main__':
    sys.exit(main())
