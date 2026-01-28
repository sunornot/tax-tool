
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { EmployeeData, OptimizationSummary } from './types';
import { optimizeBonus } from './services/taxCalculator';
import { getCFOAdvice } from './services/geminiService';
import { InfoCard } from './components/InfoCard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
  LineChart, Line, ReferenceDot, Label
} from 'recharts';

const App: React.FC = () => {
  const [data, setData] = useState<EmployeeData>({
    monthlySalary: 18000,
    annualBonus: 100000,
    socialInsurance: 3000,
    additionalDeductions: 2500,
    otherDeductions: 0
  });

  const [summary, setSummary] = useState<OptimizationSummary | null>(null);
  const [cfoAdvice, setCfoAdvice] = useState<string>('正在分析数据，请稍候...');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [showExcelTools, setShowExcelTools] = useState(false);

  const runOptimization = useCallback(() => {
    const result = optimizeBonus(data);
    setSummary(result);
  }, [data]);

  useEffect(() => {
    runOptimization();
  }, [runOptimization]);

  useEffect(() => {
    if (!summary) return;
    const timer = setTimeout(async () => {
      setIsLoadingAdvice(true);
      const advice = await getCFOAdvice(data, summary);
      setCfoAdvice(advice || "");
      setIsLoadingAdvice(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [data, summary]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const barChartData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: '方案A(单独计税)', tax: summary.allBonusStrategy.totalTax, net: summary.allBonusStrategy.netIncome },
      { name: '方案B(并入工资)', tax: summary.allSalaryStrategy.totalTax, net: summary.allSalaryStrategy.netIncome },
      { name: '最优方案(C)', tax: summary.bestStrategy.totalTax, net: summary.bestStrategy.netIncome },
    ];
  }, [summary]);

  const excelFormulas = {
    salaryTax: `=MAX(0, (B2*12 + F2 - D2*12 - E2*12 - 60000) * LOOKUP(MAX(0, B2*12 + F2 - D2*12 - E2*12 - 60000), {0,36000,144000,300000,420000,660000,960000}, {0.03,0.1,0.2,0.25,0.3,0.35,0.45}) - LOOKUP(MAX(0, B2*12 + F2 - D2*12 - E2*12 - 60000), {0,36000,144000,300000,420000,660000,960000}, {0,2520,16920,31920,52920,85920,181920}))`,
    bonusTax: `=MAX(0, (C2-F2) * LOOKUP(MAX(0, (C2-F2)/12), {0,3000,12000,25000,35000,55000,80000}, {0.03,0.1,0.2,0.25,0.3,0.35,0.45}) - LOOKUP(MAX(0, (C2-F2)/12), {0,3000,12000,25000,35000,55000,80000}, {0,210,1410,2660,4410,7160,15160}))`
  };

  return (
    <div className="min-h-screen pb-12">
      <header className="bg-slate-900 text-white py-8 shadow-lg mb-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="bg-blue-600 p-3 rounded-lg">
              <i className="fas fa-briefcase text-2xl"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">CFO 奖金税务优化专家</h1>
              <p className="text-slate-400 text-sm">专业的年终奖发放策略模拟器</p>
            </div>
          </div>
          <button 
            onClick={() => setShowExcelTools(!showExcelTools)}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 transition-colors px-4 py-2 rounded-lg font-semibold text-sm"
          >
            <i className="fas fa-file-excel"></i>
            <span>{showExcelTools ? '隐藏工具箱' : '获取 Excel 公式'}</span>
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4">
        {showExcelTools && (
          <div className="mb-8 bg-white border-2 border-green-500 rounded-2xl overflow-hidden shadow-xl animate-in fade-in zoom-in duration-300">
            <div className="bg-green-600 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg flex items-center">
                <i className="fas fa-microchip mr-2"></i> Excel 财务模型算法说明 (无需 LET 函数)
              </h3>
              <button onClick={() => setShowExcelTools(false)} className="hover:bg-green-700 p-1 rounded">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Formula Blocks */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-bold text-slate-700">工资所得税公式 (单元格 H2)</p>
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">直接下拉可用</span>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl text-green-400 text-xs font-mono break-all select-all leading-relaxed border border-slate-700">
                      {excelFormulas.salaryTax}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-bold text-slate-700">年终奖税公式 (单元格 I2)</p>
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">自动处理 12 个月换算</span>
                    </div>
                    <div className="bg-slate-900 p-4 rounded-xl text-green-400 text-xs font-mono break-all select-all leading-relaxed border border-slate-700">
                      {excelFormulas.bonusTax}
                    </div>
                  </div>
                </div>

                {/* Audit Explanation */}
                <div className="bg-green-50/50 p-6 rounded-xl border border-green-100">
                  <h4 className="font-bold text-green-800 mb-3 flex items-center text-sm">
                    <i className="fas fa-shield-check mr-2"></i> 审计逻辑要点 (CFO 必读)
                  </h4>
                  <ul className="space-y-3 text-xs text-green-900 leading-relaxed">
                    <li className="flex items-start">
                      <span className="mr-2 mt-1">●</span>
                      <span><strong>避开税率陷阱：</strong>年终奖存在“多发1元，到手少几千”的跳档区。公式会自动计算这些临界点，通过对比 J 列总实发金额，你会发现即使工资跳档，只要年终奖降档省下的税更多，方案就是最优的。</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 mt-1">●</span>
                      <span><strong>公式容错性：</strong>公式内嵌套了 <code>MAX(0, ...)</code> 逻辑，即使员工工资抵扣后为负数（未达起征点），也会按 0 计算而非报错。</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2 mt-1">●</span>
                      <span><strong>动态分摊：</strong>F 列是你博弈的筹码。建议针对重点高薪员工，分别填入 <code>0</code> (全部奖金) 和 <code>C2</code> (全部并入工资)，对比 J 列即可。</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">B 列</p>
                  <p className="text-xs font-medium">月度工资</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">C 列</p>
                  <p className="text-xs font-medium">奖金总额</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">D+E 列</p>
                  <p className="text-xs font-medium">各类月度扣除</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-blue-500 font-bold uppercase">F 列</p>
                  <p className="text-xs font-bold text-blue-600 underline">并入工资额</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-green-500 font-bold uppercase">J 列</p>
                  <p className="text-xs font-bold text-green-600">最终实发</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-bold mb-6 flex items-center">
                <i className="fas fa-sliders-h mr-2 text-blue-600"></i> 参数设置
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">月度基本工资 (元)</label>
                  <input
                    type="number"
                    name="monthlySalary"
                    value={data.monthlySalary}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">年终奖总额 (元)</label>
                  <input
                    type="number"
                    name="annualBonus"
                    value={data.annualBonus}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-bold text-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">五险一金/月</label>
                    <input
                      type="number"
                      name="socialInsurance"
                      value={data.socialInsurance}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">专项附加/月</label>
                    <input
                      type="number"
                      name="additionalDeductions"
                      value={data.additionalDeductions}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <i className="fas fa-brain text-8xl"></i>
              </div>
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <i className="fas fa-robot mr-2"></i> CFO 战略建议
              </h3>
              <div className={`text-sm leading-relaxed ${isLoadingAdvice ? 'animate-pulse' : ''}`}>
                {cfoAdvice}
              </div>
              <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center text-xs">
                <span>基于 Gemini 3 Pro 驱动</span>
                <i className="fas fa-quote-right text-white/40"></i>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InfoCard 
                  title="最优方案税额" 
                  value={`¥${summary.bestStrategy.totalTax.toLocaleString()}`} 
                  icon="fa-file-invoice-dollar" 
                  colorClass="bg-blue-500"
                />
                <InfoCard 
                  title="员工实发收入" 
                  value={`¥${summary.bestStrategy.netIncome.toLocaleString()}`} 
                  icon="fa-hand-holding-usd" 
                  colorClass="bg-green-500"
                />
                <InfoCard 
                  title="税务筹划节省" 
                  value={`¥${summary.savings.toLocaleString()}`} 
                  icon="fa-shield-alt" 
                  colorClass="bg-amber-500"
                />
              </div>
            )}

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                  <i className="fas fa-search-dollar mr-3 text-indigo-600"></i> “黄金最优解”寻迹图
                </h2>
                <span className="text-xs text-slate-400">横轴：划分为年终奖的金额 | 纵轴：总税额</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={summary?.searchPath} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="bonusPart" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      formatter={(value: number) => [`¥${Math.round(value)}`, '预计税额']}
                      labelFormatter={(label) => `分配到奖金: ¥${label}`}
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalTax" 
                      stroke="#6366f1" 
                      strokeWidth={3} 
                      dot={false} 
                      animationDuration={1500}
                    />
                    {summary && (
                      <ReferenceDot 
                        x={summary.bestStrategy.bonusAsTaxable} 
                        y={summary.bestStrategy.totalTax} 
                        r={6} 
                        fill="#22c55e" 
                        stroke="#fff" 
                        strokeWidth={2}
                      >
                        <Label value="黄金最优解" position="top" offset={10} fill="#166534" fontSize={12} fontWeight="bold" />
                      </ReferenceDot>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-4 text-xs text-slate-500 leading-relaxed italic">
                * 曲线中的尖峰代表“跳档税务陷阱”，低谷则是税务负担最轻的黄金区域。
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold mb-8 text-slate-800 flex items-center">
                <i className="fas fa-chart-bar mr-3 text-blue-600"></i> 方案横向对比
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                    <Bar dataKey="tax" name="预计应缴税额" radius={[6, 6, 0, 0]} barSize={50}>
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 2 ? '#2563eb' : '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800">测算结果明细表</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-6 py-4">方案名称</th>
                      <th className="px-6 py-4">年终奖部分</th>
                      <th className="px-6 py-4">工资薪金部分</th>
                      <th className="px-6 py-4">总税额</th>
                      <th className="px-6 py-4 text-right">税后总实发</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {summary && [summary.allBonusStrategy, summary.allSalaryStrategy, summary.bestStrategy].map((res, i) => (
                      <tr key={i} className={`hover:bg-slate-50 transition-colors ${i === 2 ? 'bg-blue-50/50' : ''}`}>
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {res.strategyName}
                          {i === 2 && <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">推荐</span>}
                        </td>
                        <td className="px-6 py-4 text-slate-600">¥{res.bonusAsTaxable.toLocaleString()}</td>
                        <td className="px-6 py-4 text-slate-600">¥{res.salaryAsTaxable.toLocaleString()}</td>
                        <td className="px-6 py-4 text-red-500 font-semibold">¥{res.totalTax.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">¥{res.netIncome.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
