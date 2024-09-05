import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    // jwks.jsonファイルの絶対パスを取得
    const filePath = path.join(process.cwd(), "jwks.json");

    // ファイルの内容を読み込む
    const fileContents = await fs.readFile(filePath, "utf8");

    // JSONとしてパース
    const jwks = JSON.parse(fileContents);

    // レスポンスを返す
    return new NextResponse(JSON.stringify(jwks), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600", // 1時間キャッシュ
      },
    });
  } catch (error) {
    console.error("Error reading JWKS file:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
