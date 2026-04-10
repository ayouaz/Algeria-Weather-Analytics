/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cloud, 
  Thermometer, 
  Droplets, 
  Wind, 
  Calendar, 
  MapPin, 
  Download, 
  BarChart3, 
  Table as TableIcon,
  Search,
  Loader2,
  AlertCircle,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format, subDays, parseISO, isWithinInterval } from 'date-fns';
import { ALGERIAN_CITIES, type City } from './constants';
import { type HourlyData } from './types';
import { cn, exportToCSV } from './lib/utils';

export default function App() {
  const [selectedCity, setSelectedCity] = useState<City>(ALGERIAN_CITIES[0]);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weatherData, setWeatherData] = useState<HourlyData[]>([]);
  const [view, setView] = useState<'charts' | 'table' | 'raw'>('charts');
  const [rawResponse, setRawResponse] = useState<any>(null);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${selectedCity.lat}&longitude=${selectedCity.lon}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m,precipitation,relative_humidity_2m,wind_speed_10m,surface_pressure,cloud_cover,dew_point_2m`
      );
      
      if (!response.ok) throw new Error('Failed to fetch weather data');
      
      const data = await response.json();
      setRawResponse(data);
      
      if (!data.hourly || !data.hourly.time) {
        throw new Error('No data available for this selection');
      }

      const formattedData: HourlyData[] = data.hourly.time.map((time: string, index: number) => ({
        time: format(parseISO(time), 'yyyy-MM-dd HH:mm'),
        temp: data.hourly.temperature_2m[index],
        prcp: data.hourly.precipitation[index],
        rhum: data.hourly.relative_humidity_2m[index],
        wspd: data.hourly.wind_speed_10m[index],
        pres: data.hourly.surface_pressure[index],
        clouds: data.hourly.cloud_cover ? data.hourly.cloud_cover[index] : 0,
        dew: data.hourly.dew_point_2m ? data.hourly.dew_point_2m[index] : 0,
      }));

      setWeatherData(formattedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setWeatherData([]);
      setRawResponse(null);
    } finally {
      setLoading(false);
    }
  };

  const generateMockSynop = (hour: any, index: number) => {
    if (!hour) return "";
    const date = parseISO(hour.time[index]);
    const day = format(date, 'dd');
    const hh = format(date, 'HH');
    const stationCode = selectedCity.code;
    
    // Simplified SYNOP-like string
    // AAXX DDHHMM IIiii ...
    const temp = Math.abs(Math.round(hour.temperature_2m[index] * 10)).toString().padStart(3, '0');
    const tempSign = hour.temperature_2m[index] >= 0 ? '0' : '1';
    const dew = Math.abs(Math.round(hour.dew_point_2m[index] * 10)).toString().padStart(3, '0');
    const dewSign = hour.dew_point_2m[index] >= 0 ? '0' : '1';
    const pres = Math.round(hour.surface_pressure[index] * 10).toString().slice(-4);
    const windSpeed = Math.round(hour.wind_speed_10m[index] / 1.852).toString().padStart(2, '0'); // knots
    
    return `AAXX ${day}${hh}1 ${stationCode} 11580 83605 1${tempSign}${temp} 2${dewSign}${dew} 4${pres} 52004 333 10160 20080=`;
  };

  const stats = useMemo(() => {
    if (weatherData.length === 0) return null;
    return {
      avgTemp: weatherData.reduce((acc, curr) => acc + curr.temp, 0) / weatherData.length,
      maxPrcp: Math.max(...weatherData.map(d => d.prcp)),
      avgRhum: weatherData.reduce((acc, curr) => acc + curr.rhum, 0) / weatherData.length,
      avgWind: weatherData.reduce((acc, curr) => acc + curr.wspd, 0) / weatherData.length,
    };
  }, [weatherData]);

  const handleDownload = () => {
    exportToCSV(weatherData, `weather_${selectedCity.name}_${startDate}_to_${endDate}.csv`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">الأرصاد الجوية الجزائرية</h1>
              <p className="text-xs text-slate-500 font-medium">تحليل البيانات التاريخية ساعة بساعة</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <Info className="w-4 h-4" />
              <span>بيانات من محطات SYNOP العالمية</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Controls */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  اختر الولاية
                </label>
                <select 
                  value={selectedCity.name}
                  onChange={(e) => setSelectedCity(ALGERIAN_CITIES.find(c => c.name === e.target.value) || ALGERIAN_CITIES[0])}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-medium"
                >
                  {ALGERIAN_CITIES.map(city => (
                    <option key={city.name} value={city.name}>
                      {city.name} ({city.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  الفترة الزمنية
                </label>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1 block">من</span>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1 block">إلى</span>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={fetchWeather}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    جلب البيانات الآن
                  </>
                )}
              </button>
            </div>

            {weatherData.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 p-6 rounded-2xl text-white space-y-4"
              >
                <h3 className="font-bold flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-400" />
                  تصدير النتائج
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  يمكنك تحميل كافة البيانات المستخرجة بصيغة CSV لاستخدامها في Excel أو برامج التحليل الأخرى.
                </p>
                <button 
                  onClick={handleDownload}
                  className="w-full bg-white/10 hover:bg-white/20 text-white text-sm font-bold py-2.5 rounded-lg transition-colors border border-white/10"
                >
                  تحميل الملف
                </button>
              </motion.div>
            )}
          </aside>

          {/* Main Content Area */}
          <section className="lg:col-span-9 space-y-8">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-700"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}

              {weatherData.length === 0 && !loading && !error && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4"
                >
                  <div className="bg-slate-50 p-6 rounded-full">
                    <Cloud className="w-12 h-12 text-slate-300" />
                  </div>
                  <div className="max-w-xs">
                    <h3 className="text-lg font-bold text-slate-900">ابدأ تحليل البيانات</h3>
                    <p className="text-sm text-slate-500 mt-2">
                      قم باختيار الولاية والتاريخ من القائمة الجانبية ثم اضغط على زر البحث لعرض النتائج.
                    </p>
                  </div>
                </motion.div>
              )}

              {weatherData.length > 0 && (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-8"
                >
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard 
                      label="متوسط الحرارة" 
                      value={`${stats?.avgTemp.toFixed(1)}°C`} 
                      icon={<Thermometer className="w-5 h-5 text-orange-500" />}
                      color="orange"
                    />
                    <StatCard 
                      label="أقصى تساقط" 
                      value={`${stats?.maxPrcp.toFixed(1)} mm`} 
                      icon={<Droplets className="w-5 h-5 text-blue-500" />}
                      color="blue"
                    />
                    <StatCard 
                      label="متوسط الرطوبة" 
                      value={`${stats?.avgRhum.toFixed(0)}%`} 
                      icon={<Cloud className="w-5 h-5 text-indigo-500" />}
                      color="indigo"
                    />
                    <StatCard 
                      label="متوسط الرياح" 
                      value={`${stats?.avgWind.toFixed(1)} km/h`} 
                      icon={<Wind className="w-5 h-5 text-emerald-500" />}
                      color="emerald"
                    />
                  </div>

                  {/* View Toggle */}
                  <div className="flex items-center justify-between bg-white p-1.5 rounded-2xl border border-slate-200 w-fit overflow-x-auto max-w-full">
                    <button 
                      onClick={() => setView('charts')}
                      className={cn(
                        "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                        view === 'charts' ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      <BarChart3 className="w-4 h-4" />
                      الرسوم البيانية
                    </button>
                    <button 
                      onClick={() => setView('table')}
                      className={cn(
                        "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                        view === 'table' ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      <TableIcon className="w-4 h-4" />
                      جدول البيانات
                    </button>
                    <button 
                      onClick={() => setView('raw')}
                      className={cn(
                        "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                        view === 'raw' ? "bg-blue-600 text-white shadow-md" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      <AlertCircle className="w-4 h-4" />
                      البيانات الخام (SYNOP)
                    </button>
                  </div>

                  {/* Content Switcher */}
                  <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[500px]">
                    {view === 'charts' ? (
                      <div className="space-y-12">
                        <section>
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                              <div className="w-2 h-6 bg-orange-500 rounded-full" />
                              تغير درجة الحرارة
                            </h3>
                          </div>
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={weatherData}>
                                <defs>
                                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                  dataKey="time" 
                                  hide 
                                />
                                <YAxis 
                                  unit="°" 
                                  stroke="#94a3b8" 
                                  fontSize={12} 
                                  tickLine={false} 
                                  axisLine={false} 
                                />
                                <Tooltip 
                                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="temp" 
                                  stroke="#f97316" 
                                  strokeWidth={3}
                                  fillOpacity={1} 
                                  fill="url(#colorTemp)" 
                                  name="الحرارة"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </section>

                        <section>
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                              <div className="w-2 h-6 bg-blue-500 rounded-full" />
                              كمية التساقط
                            </h3>
                          </div>
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={weatherData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                  dataKey="time" 
                                  hide 
                                />
                                <YAxis 
                                  unit="mm" 
                                  stroke="#94a3b8" 
                                  fontSize={12} 
                                  tickLine={false} 
                                  axisLine={false} 
                                />
                                <Tooltip 
                                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar 
                                  dataKey="prcp" 
                                  fill="#3b82f6" 
                                  radius={[4, 4, 0, 0]} 
                                  name="الأمطار"
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </section>
                      </div>
                    ) : view === 'table' ? (
                      <div className="overflow-x-auto -mx-6 md:mx-0">
                        <table className="w-full text-sm text-right">
                          <thead>
                            <tr className="border-b border-slate-100">
                              <th className="px-6 py-4 font-bold text-slate-500">الوقت</th>
                              <th className="px-6 py-4 font-bold text-slate-500">الحرارة (°C)</th>
                              <th className="px-6 py-4 font-bold text-slate-500">الأمطار (mm)</th>
                              <th className="px-6 py-4 font-bold text-slate-500">الرطوبة (%)</th>
                              <th className="px-6 py-4 font-bold text-slate-500">الرياح (km/h)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {weatherData.slice(0, 100).map((row, i) => (
                              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-medium">{row.time}</td>
                                <td className="px-6 py-4">{row.temp.toFixed(1)}</td>
                                <td className="px-6 py-4">{row.prcp.toFixed(1)}</td>
                                <td className="px-6 py-4">{row.rhum.toFixed(0)}</td>
                                <td className="px-6 py-4">{row.wspd.toFixed(1)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {weatherData.length > 100 && (
                          <div className="p-6 text-center text-slate-400 text-xs">
                            تم عرض أول 100 سجل فقط. قم بتحميل الملف لرؤية كافة البيانات.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-slate-900 rounded-2xl p-6 overflow-hidden">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-blue-400 font-bold text-sm flex items-center gap-2">
                              <Info className="w-4 h-4" />
                              Simulated SYNOP Messages (Last 24h)
                            </h4>
                          </div>
                          <div className="font-mono text-xs text-slate-300 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {rawResponse?.hourly?.time?.slice(-24).reverse().map((t: string, i: number) => (
                              <div key={i} className="p-2 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                <span className="text-slate-500 mr-4">[{format(parseISO(t), 'HH:mm')}]</span>
                                {generateMockSynop(rawResponse.hourly, rawResponse.hourly.time.length - 1 - i)}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                          <h4 className="text-slate-900 font-bold text-sm mb-4 flex items-center gap-2">
                            <TableIcon className="w-4 h-4 text-blue-600" />
                            Raw API Response (JSON)
                          </h4>
                          <pre className="text-[10px] font-mono text-slate-600 overflow-auto max-h-[400px] bg-white p-4 rounded-xl border border-slate-100">
                            {JSON.stringify(rawResponse, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-slate-200 mt-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>يتم جلب البيانات من Open-Meteo Historical API</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors text-sm font-medium">عن التطبيق</a>
            <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors text-sm font-medium">سياسة الخصوصية</a>
            <a href="#" className="text-slate-400 hover:text-blue-600 transition-colors text-sm font-medium">اتصل بنا</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: string, icon: React.ReactNode, color: string }) {
  const colorClasses = {
    orange: "bg-orange-50 text-orange-600",
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
  }[color as keyof typeof colorClasses];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorClasses)}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{label}</p>
        <p className="text-xl font-black text-slate-900">{value}</p>
      </div>
    </div>
  );
}
