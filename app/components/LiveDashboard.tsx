
import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Activity, Search, FileText, Zap } from 'lucide-react';

export default function LiveDashboard() {
    const [scanPosition, setScanPosition] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setScanPosition((prev) => (prev + 1) % 100);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative w-full max-w-2xl mx-auto perspective-1000">
            {/* Ana Panel Container - 3D Dönüş Efekti */}
            <div className="relative bg-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden transform rotate-y-6 rotate-x-6 transition-transform duration-500 hover:rotate-0 p-6">

                {/* Üst Bar */}
                <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                    <div className="px-3 py-1 bg-slate-800 rounded-full text-xs text-blue-400 font-mono flex items-center">
                        <Activity className="w-3 h-3 mr-2" />
                        Canlı Sistem İzleme
                    </div>
                </div>

                {/* İçerik Grid */}
                <div className="grid grid-cols-12 gap-4">

                    {/* Sol Kolon - Grafikler ve İstatistikler */}
                    <div className="col-span-8 space-y-4">
                        {/* Risk Grafiği */}
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 relative overflow-hidden group">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xs font-bold text-slate-300 uppercase">Risk Analiz Durumu</h3>
                                <span className="text-[10px] text-green-400">Aktif</span>
                            </div>
                            <div className="flex items-end space-x-2 h-24">
                                {[40, 65, 30, 85, 50, 75, 45].map((h, i) => (
                                    <div key={i} className="flex-1 bg-blue-600/30 rounded-t relative overflow-hidden">
                                        <div
                                            className="absolute bottom-0 left-0 w-full bg-blue-500 transition-all duration-1000 ease-in-out"
                                            style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
                                        />
                                    </div>
                                ))}
                            </div>
                            {/* Tarama Çizgisi */}
                            <div
                                className="absolute top-0 bottom-0 w-[2px] bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] z-10 transition-all duration-75 opacity-70"
                                style={{ left: `${scanPosition}%` }}
                            />
                        </div>

                        {/* Alt İstatistikler */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                <div className="text-[10px] text-slate-400 mb-1">Tespit Edilen Tehlike</div>
                                <div className="text-2xl font-bold text-white flex items-center">
                                    24
                                    <span className="text-[10px] text-green-500 ml-2 flex items-center bg-green-900/30 px-1 rounded">
                                        <Zap className="w-3 h-3 mr-0.5" /> +12%
                                    </span>
                                </div>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                <div className="text-[10px] text-slate-400 mb-1">Tamamlanan Analiz</div>
                                <div className="text-2xl font-bold text-white flex items-center">
                                    100%
                                    <CheckCircle className="w-4 h-4 text-blue-500 ml-2" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sağ Kolon - İşlem Logları */}
                    <div className="col-span-4 space-y-3">
                        <h3 className="text-xs font-bold text-slate-300 uppercase mb-2">Sistem Logları</h3>
                        <div className="space-y-2">
                            {[
                                { text: "Veri tabanı bağlandı", status: "success", time: "10:42:01" },
                                { text: "Risk algılandı: S-2", status: "warning", time: "10:42:05" },
                                { text: "Önlem paketi: A", status: "info", time: "10:42:08" },
                                { text: "Rapor oluşturuluyor...", status: "process", time: "10:42:12" },
                            ].map((log, i) => (
                                <div key={i} className="bg-slate-800 p-2 rounded border border-slate-700 text-[10px] flex flex-col animate-in slide-in-from-right fade-in duration-500" style={{ animationDelay: `${i * 500}ms` }}>
                                    <div className="flex justify-between text-slate-500 text-[9px] mb-0.5">
                                        <span>{log.time}</span>
                                        <span className={
                                            log.status === 'success' ? 'text-green-400' :
                                                log.status === 'warning' ? 'text-orange-400' :
                                                    log.status === 'process' ? 'text-blue-400 animate-pulse' : 'text-blue-300'
                                        }>{log.status === 'process' ? 'İşleniyor' : 'OK'}</span>
                                    </div>
                                    <span className="text-slate-200">{log.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Yüzen Bildirim Kartı (Animasyonlu) */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-800/90 backdrop-blur-md px-6 py-4 rounded-xl border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.2)] flex items-center space-x-4 animate-bounce-slow z-20">
                    <div className="bg-green-500/20 p-2 rounded-full">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm">Risk Değerlendirmesi Hazır</h4>
                        <p className="text-xs text-slate-300">Yapay zeka analizi tamamlandı.</p>
                    </div>
                </div>

            </div>

            {/* Arka Plan Glow Efekti */}
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur-2xl opacity-20 -z-10 animate-pulse"></div>
        </div>
    );
}
