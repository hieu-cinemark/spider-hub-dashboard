"use client";

import { KeyOutlined, LoginOutlined, RadarChartOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { useState } from "react";

export default function LoginScreen({ onSubmit }: { onSubmit: (key: string) => boolean }) {
  const [invalid, setInvalid] = useState(false);

  function handleFinish(values: { key: string }) {
    setInvalid(!onSubmit(values.key.trim()));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f5f7] px-4">
      <Card className="w-full max-w-sm shadow-sm">
        <div className="mb-5 flex flex-col items-center gap-2 text-center">
          <RadarChartOutlined className="text-3xl text-[#2f54eb]" />
          <Typography.Title level={4} className="!mb-0">
            spider-hub dashboard
          </Typography.Title>
          <Typography.Text type="secondary">Enter the access key to continue</Typography.Text>
        </div>

        {invalid && <Alert type="error" showIcon title="Invalid access key" className="!mb-4" />}

        <Form layout="vertical" onFinish={handleFinish} onValuesChange={() => setInvalid(false)}>
          <Form.Item name="key" rules={[{ required: true, message: "Access key is required" }]}>
            <Input.Password prefix={<KeyOutlined />} placeholder="Access key" autoFocus size="large" />
          </Form.Item>
          <Form.Item className="!mb-0">
            <Button type="primary" htmlType="submit" icon={<LoginOutlined />} block size="large">
              Continue
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
