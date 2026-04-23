import { describe, it, expect } from "vitest";
import { execFileSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.join(__dirname, "generate_poster.py");

describe("generate_poster.py", () => {
  it("should generate a valid PDF with text-only params", () => {
    const params = {
      name: "小智",
      hometown: "广东惠州",
      coolest: "帅哭自己",
      reason: "打道馆的感觉",
      harvest: "变得更帅",
      image_b64: "",
      img_scale: 1.0,
      img_offset_x: 0,
      img_offset_y: 0,
    };

    const result = execFileSync("/usr/bin/python3.11", [scriptPath], {
      input: JSON.stringify(params),
      maxBuffer: 20 * 1024 * 1024,
    });

    // PDF starts with %PDF
    expect(result.slice(0, 4).toString("ascii")).toBe("%PDF");
    expect(result.length).toBeGreaterThan(1000);
  });

  it("should generate a valid PDF with image", () => {
    // Use a small test image (1x1 red pixel PNG)
    const pngBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==";

    const params = {
      name: "测试",
      hometown: "北京",
      coolest: "写代码",
      reason: "学习",
      harvest: "成长",
      image_b64: pngBase64,
      img_scale: 1.0,
      img_offset_x: 0,
      img_offset_y: 0,
    };

    const result = execFileSync("/usr/bin/python3.11", [scriptPath], {
      input: JSON.stringify(params),
      maxBuffer: 20 * 1024 * 1024,
    });

    expect(result.slice(0, 4).toString("ascii")).toBe("%PDF");
    expect(result.length).toBeGreaterThan(1000);
  });

  it("should handle empty params gracefully", () => {
    const params = {
      name: "",
      hometown: "",
      coolest: "",
      reason: "",
      harvest: "",
      image_b64: "",
      img_scale: 1.0,
      img_offset_x: 0,
      img_offset_y: 0,
    };

    const result = execFileSync("/usr/bin/python3.11", [scriptPath], {
      input: JSON.stringify(params),
      maxBuffer: 20 * 1024 * 1024,
    });

    expect(result.slice(0, 4).toString("ascii")).toBe("%PDF");
  });
});
