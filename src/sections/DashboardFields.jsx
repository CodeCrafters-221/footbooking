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
                        <div className="p-4 flex gap-3">
                            <div className="flex items-center justify-between w-full gap-5 ">
                                <div >
                                    <h4 className="text-white font-bold text-lg">{field.name}</h4>
                                    <p className="text-[#cbad90] text-sm">{field.type}</p>
                                </div>
                                <div className="text-lg font-black text-white">
                                    {(field.price || 0).toLocaleString()} <span className="text-sm font-bold text-[#f27f0d]">CFA/h</span>
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
