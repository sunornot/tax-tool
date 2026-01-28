
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { EmployeeData, OptimizationSummary } from './types';
import { optimizeBonus } from './services/taxCalculator';
import { getCFOAdvice } from './services/geminiService';
import { InfoCard } from './components/InfoCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const App: React.FC = () => {
  const [data, setData] = useState<EmployeeData>({
    monthlySalary: 15000,
    annualBonus: 50000,
    socialInsurance: 2500,
    additionalDeductions: 2000,
    otherDeductions: 0
  });

  const [summary, setSummary] = useState<OptimizationSummary | null>(null);
  const [cfoAdvice, setCfoAdvice] = useState<string>('正在分析数据，请稍候...');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);

  // 计算优化结果
  const runOptimization = useCallback(() => {
    const result = optimizeBonus(data);
    setSummary(result);
  }, [data]);

  useEffect(() => {
    runOptimization();
  }, [runOptimization]);

  // AI 建议 (节流以防频繁调用)
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

  const chartData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: '方案A(年终奖)', tax: summary.allBonusStrategy.totalTax, net: summary.allBonusStrategy.netIncome },
      { name: '方案B(工资)', tax: summary.allSalaryStrategy.totalTax, net: summary.allSalaryStrategy.netIncome },
      { name: '最优方案', tax: summary.bestStrategy.totalTax, net: summary.bestStrategy.netIncome },
    ];
  }, [summary]);

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
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
          <div className="text-right">
            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-green-500/30">
              数据实时同步中
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Panel: Inputs */}
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

            {/* AI Advisor Box */}
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
                <span>基于 Gemini 3 Flash 模型</span>
                <i className="fas fa-quote-right text-white/40"></i>
              </div>
            </div>
          </div>

          {/* Right Panel: Analysis */}
          <div className="lg:col-span-8 space-y-6">
            {/* Quick Stats */}
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

            {/* Main Visual Analysis */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold mb-8 text-slate-800 flex items-center">
                <i className="fas fa-chart-bar mr-3 text-blue-600"></i> 各方案税负对比
              </h2>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                    <Bar dataKey="tax" name="预计应缴税额" radius={[6, 6, 0, 0]} barSize={50}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 2 ? '#2563eb' : '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h2 className="text-lg font-bold text-slate-800">测算结果明细表</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-6 py-4">方案名称</th>
                      <th className="px-6 py-4">发放至年终奖(元)</th>
                      <th className="px-6 py-4">发放至工资(元)</th>
                      <th className="px-6 py-4">总税额</th>
                      <th className="px-6 py-4 text-right">税后总实发</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {summary && [summary.allBonusStrategy, summary.allSalaryStrategy, summary.bestStrategy].map((res, i) => (
                      <tr key={i} className={`hover:bg-slate-50 transition-colors ${i === 2 ? 'bg-blue-50/50' : ''}`}>
                        <td className="px-6 py-4 font-medium text-slate-800">
                          {res.strategyName}
                          {i === 2 && <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">最优</span>}
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

            {/* Tax Trap Warning */}
            <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-2xl">
              <div className="flex">
                <div className="flex-shrink-0">
                  <i className="fas fa-exclamation-triangle text-amber-400 text-xl"></i>
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-bold text-amber-800">CFO 风险提示：年终奖避税陷阱</h3>
                  <div className="mt-2 text-sm text-amber-700 space-y-2">
                    <p>
                      年终奖计算中存在著名的“多发一元，税后少拿数千元”的跳档区域。
                      本工具已通过最优拆分（方案C）为您避开了以下临界点附近的税务陷阱：
                    </p>
                    <ul className="list-disc list-inside grid grid-cols-2 gap-1 text-xs font-semibold">
                      <li>36,000 元</li>
                      <li>144,000 元</li>
                      <li>300,000 元</li>
                      <li>420,000 元</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Sticky Bottom Actions (Mobile) */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-4 md:hidden flex justify-between items-center shadow-2xl">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500">最高可省</span>
          <span className="text-lg font-bold text-blue-600">¥{summary?.savings.toLocaleString()}</span>
        </div>
        <button 
          onClick={runOptimization}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-200"
        >
          立即优化
        </button>
      </div>
    </div>
  );
};

export default App;
