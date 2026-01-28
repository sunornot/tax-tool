
import { GoogleGenAI } from "@google/genai";
import { EmployeeData, OptimizationSummary } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getCFOAdvice = async (data: EmployeeData, summary: OptimizationSummary) => {
  const prompt = `
    你是一位资深的集团财务总监 (CFO)。
    当前员工情况：
    - 月薪：${data.monthlySalary} 元
    - 年终奖：${data.annualBonus} 元
    - 专项附加扣除：${data.additionalDeductions} 元/月
    
    税务计算结果：
    - 方案A (单独计税) 总税额：${summary.allBonusStrategy.totalTax.toFixed(2)} 元
    - 方案B (并入计税) 总税额：${summary.allSalaryStrategy.totalTax.toFixed(2)} 元
    - 最优方案：${summary.bestStrategy.strategyName}
    - 最优税额：${summary.bestStrategy.totalTax.toFixed(2)} 元
    - 相比最差方案可节省：${summary.savings.toFixed(2)} 元
    
    请基于以上数据，用专业、干练的CFO口吻提供一段策略建议（200字以内）。
    重点说明：
    1. 为什么当前的最优方案是最好的？
    2. 是否存在个税“避税区”或“陷阱区”？
    3. 对公司整体薪酬包设计的启示。
    请直接输出建议内容，不要带有任何Markdown格式以外的解释。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "抱歉，作为CFO，我目前无法即时处理更深层次的分析，请先参考下方的计算数据进行决策。";
  }
};
