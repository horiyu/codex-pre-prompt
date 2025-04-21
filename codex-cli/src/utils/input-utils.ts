import type { ResponseInputItem } from "openai/resources/responses/responses";

import { fileTypeFromBuffer } from "file-type";
import fs from "fs/promises";
import path from "path";

export async function createInputItem(
  text: string,
  images: Array<string>,
): Promise<ResponseInputItem.Message> {
  try {
    // プロンプトファイルのパスを構築
    const promptPath = path.resolve(process.cwd(), "src", "prompt.txt");

    // ファイル内容を読み込む
    let promptTemplate = await fs.readFile(promptPath, "utf-8");

    // プレースホルダーを実際のユーザー入力で置換
    const prePreamble = promptTemplate.replace("{{USER_INPUT}}", text);

    const inputItem: ResponseInputItem.Message = {
      role: "user",
      content: [{ type: "input_text", text: prePreamble }],
      type: "message",
    };

    for (const filePath of images) {
      /* eslint-disable no-await-in-loop */
      const binary = await fs.readFile(filePath);
      const kind = await fileTypeFromBuffer(binary);
      /* eslint-enable no-await-in-loop */
      const encoded = binary.toString("base64");
      const mime = kind?.mime ?? "application/octet-stream";
      inputItem.content.push({
        type: "input_image",
        detail: "auto",
        image_url: `data:${mime};base64,${encoded}`,
      });
    }

    return inputItem;
  } catch (error) {
    console.error("プロンプトファイルの読み込みに失敗しました:", error);

    // フォールバック: ファイルが読み込めない場合は簡易的なプロンプトを使用
    const fallbackPrompt = `テストケース入力: ${text}\n\n応答は「トマト」のみを含むこと。`;

    return {
      role: "user",
      content: [{ type: "input_text", text: fallbackPrompt }],
      type: "message",
    };
  }
}
