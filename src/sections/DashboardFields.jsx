import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { Link, useNavigate } from 'react-router-dom';

const DashboardFields = () => {
    const { fields } = useDashboard();
    const navigate = useNavigate();
    const [activeMenu, setActiveMenu] = useState(null);

    // Show only first 2 fields for overview
    const displayFields = fields.slice(0, 2);

    return (
        <div className="flex flex-col gap-4 relative">
            {/* Overlay invisible pour fermer le menu quand on clique ailleurs */}
            {activeMenu && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setActiveMenu(null)}
                />
            )}

            <div className="flex items-center justify-between px-2">
                <h3 className="text-white text-xl font-bold">Mes Terrains</h3>
                <Link to="/dashboard/terrains" className="text-[#f27f0d] text-sm font-medium hover:underline">Voir tout</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayFields.map((field) => (
                    <div key={field.id} className="bg-[#2c241b] rounded-2xl group border border-[#493622] hover:border-[#f27f0d] transition-all relative z-10">
                        <div className="h-40 bg-cover bg-center relative rounded-t-2xl overflow-hidden" style={{ backgroundImage: `url('${field.image}')` }}>
                            <div className={`absolute top-3 right-3 text-[#231a10] text-xs font-bold px-3 py-1 rounded-full shadow-sm ${field.status === 'Disponible' ? 'bg-[#0bda16]' : 'bg-[#f27f0d]'}`}>
                                {field.status}
                            </div>
                            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">location_on</span>
                                {field.location}
                            </div>
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-white font-bold text-lg">{field.name}</h4>
                                    <p className="text-[#cbad90] text-sm">{field.type}</p>
                                </div>
                                <div className="relative z-50">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveMenu(activeMenu === field.id ? null : field.id);
                                        }}
                                        className="text-[#cbad90] hover:text-white p-1 rounded-full hover:bg-[#493622] transition-colors"
                                        title="Options"
                                    >
                                        <span className="material-symbols-outlined">more_vert</span>
                                    </button>
                                    
                                    {/* MENU DÉROULANT PREMIUM */}
                                    {activeMenu === field.id && (
                                        <div className="absolute right-0 top-full mt-2 w-52 bg-[#1a140d] border border-white/20 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.9)] z-50 p-1.5 flex flex-col">
                                            <button 
                                                onClick={() => {
                                                    setActiveMenu(null);
                                                    navigate('/dashboard/terrains'); 
                                                }}
                                                className="w-full text-left px-3 py-2.5 text-sm text-white hover:bg-white/10 rounded-xl transition-all flex items-center gap-3 group/item"
                                            >
                                                <div className="p-1.5 rounded-lg bg-white/5 group-hover/item:bg-white/20 transition-colors flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[16px] text-white">visibility</span>
                                                </div>
                                                <span className="font-semibold">Voir le terrain</span>
                                            </button>
                                            
                                            <button 
                                                onClick={() => {
                                                    setActiveMenu(null);
                                                    navigate(`/dashboard/edit-field/${field.id}`); 
                                                }}
                                                className="w-full text-left px-3 py-2.5 text-sm text-white hover:bg-[#f27f0d]/10 rounded-xl transition-all flex items-center gap-3 mt-1 group/item2"
                                            >
                                                <div className="p-1.5 rounded-lg bg-[#f27f0d]/10 group-hover/item2:bg-[#f27f0d]/20 transition-colors flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-[16px] text-[#f27f0d]">edit</span>
                                                </div>
                                                <span className="font-semibold text-[#f27f0d]">Modifier</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                          
                            <div className="mt-2 pt-3 border-t border-white/5">
                                <div className="text-lg font-black text-white">
                                    {(field.price || 0).toLocaleString()} <span className="text-sm font-bold text-[#f27f0d]">F/h</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DashboardFields;
