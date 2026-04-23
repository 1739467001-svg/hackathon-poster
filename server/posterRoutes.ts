import { Router, Request, Response } from "express";
import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function registerPosterRoutes(app: ReturnType<typeof Router>["stack"] extends any[] ? any : any) {
  // POST /api/generate-poster
  // Body: { name, hometown, coolest, reason, harvest, image_b64?, img_scale?, img_offset_x?, img_offset_y? }
  app.post("/api/generate-poster", (req: Request, res: Response) => {
    const params = req.body;

    if (!params || typeof params !== "object") {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const scriptPath = path.join(__dirname, "generate_poster.py");
    const inputJson = JSON.stringify(params);

    const child = execFile(
      "/usr/bin/python3.11",
      [scriptPath],
      { maxBuffer: 20 * 1024 * 1024 }, // 20MB buffer
      (error, stdout, stderr) => {
        if (error) {
          console.error("[PosterGen] Error:", error.message);
          console.error("[PosterGen] Stderr:", stderr);
          res.status(500).json({ error: "PDF generation failed", detail: stderr });
          return;
        }
        // stdout is the raw PDF bytes
        const pdfBuffer = Buffer.from(stdout, "binary");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'attachment; filename="hackathon_poster.pdf"');
        res.setHeader("Content-Length", pdfBuffer.length);
        res.end(pdfBuffer);
      }
    );

    // Write params to stdin
    if (child.stdin) {
      child.stdin.write(inputJson);
      child.stdin.end();
    }
  });
}
