import { PrismaClient } from "@prisma/client";
import { questions } from "../src/data/questions";

const prisma = new PrismaClient();

async function main() {
  console.log("开始导入预设题目...");

  let imported = 0;
  let skipped = 0;

  for (const q of questions) {
    // 检查是否已存在相同标题的题目
    const existing = await prisma.question.findFirst({
      where: { title: q.title },
    });

    if (existing) {
      console.log(`跳过已存在: ${q.title}`);
      skipped++;
      continue;
    }

    await prisma.question.create({
      data: {
        title: q.title,
        category: q.category,
        type: q.type,
        difficulty: q.difficulty,
        frequency: q.frequency,
        keyPoints: q.keyPoints,
        framework: q.framework || null,
        referenceAnswer: q.referenceAnswer,
        commonMistakes: q.commonMistakes || null,
        tips: q.tips || null,
      },
    });

    console.log(`导入成功: ${q.title}`);
    imported++;
  }

  console.log("\n========== 导入完成 ==========");
  console.log(`成功导入: ${imported} 题`);
  console.log(`跳过重复: ${skipped} 题`);
  console.log(`总计: ${questions.length} 题`);
}

main()
  .catch((e) => {
    console.error("导入失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
