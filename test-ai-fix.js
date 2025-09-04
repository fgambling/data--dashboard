// 测试AI功能字符编码修复
// 运行: node test-ai-fix.js

const fetch = require("node-fetch");

const BASE_URL = "http://localhost:3000";

// 测试包含特殊字符的输入
async function testAIFix() {
  console.log("🧪 测试AI字符编码修复...\n");

  const testCases = [
    {
      name: "标准ASCII字符",
      question: "What is the best selling product?",
      data: [{ day: "Day 1", "Product A_Sales": 100, "Product B_Sales": 200 }],
    },
    {
      name: "中文字符",
      question: "哪个产品销量最好？",
      data: [{ day: "Day 1", 产品A_Sales: 100, 产品B_Sales: 200 }],
    },
    {
      name: "特殊字符（智能引号）",
      question: 'What"s the best product?',
      data: [{ day: "Day 1", 'Product"A_Sales': 100, 'Product"B_Sales': 200 }],
    },
    {
      name: "表情符号",
      question: "Analyze the data 📊",
      data: [{ day: "Day 1", "Product🎉_Sales": 100 }],
    },
  ];

  for (const testCase of testCases) {
    console.log(`测试: ${testCase.name}`);
    console.log(`问题: "${testCase.question}"`);

    try {
      const response = await fetch(`${BASE_URL}/api/ai/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chartData: testCase.data,
          userQuestion: testCase.question,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log("✅ 成功处理");
        console.log(`回答: ${result.answer.substring(0, 50)}...\n`);
      } else {
        console.log("❌ API错误:", result.error, "\n");
      }
    } catch (error) {
      console.log("❌ 网络错误:", error.message, "\n");
    }
  }

  console.log("🎉 测试完成！");
}

// 如果直接运行此脚本
if (require.main === module) {
  testAIFix();
}

module.exports = { testAIFix };
