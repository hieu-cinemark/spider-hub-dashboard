import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js đã tối ưu `antd` và `@ant-design/icons` mặc định (chuyển
  // barrel-import thành import từng module), nên không cần khai báo lại ở
  // đây. Giữ config tối thiểu để tránh can thiệp vào pipeline của Next.
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
