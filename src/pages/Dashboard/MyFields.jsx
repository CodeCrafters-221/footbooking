import React, { useState } from "react";
import { useDashboard } from "../../context/DashboardContext";
import { Link, useNavigate } from "react-router-dom";

const MyFields = () => {
  const navigate = useNavigate();
  const {
    fields,
    deleteField,
    toggleFieldStatus,
  } = useDashboard();

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-4">
        <h2 className="text-white text-2xl md:text-3xl font-bold">Mes Terrains</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {fields.map((field) => (
          <div
            key={field.id}
            className="bg-[#2c241b] rounded-2xl overflow-hidden group border border-[#493622] hover:border-[#f27f0d] transition-all"
          >
            <div
              className="h-48 bg-cover bg-center relative"
              style={{ backgroundImage: `url('${field.image}')` }}
            >
              <button
                onClick={() => toggleFieldStatus(field.id, field.status)}
                className={`absolute top-3 right-3 text-[#231a10] text-xs font-bold px-3 py-1 rounded-full shadow-sm transition-all hover:scale-110 active:scale-95 ${field.status === "Disponible" ? "bg-[#0bda16]" : "bg-[#f27f0d]"}`}
              >
                {field.status}
              </button>
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  location_on
                </span>
                {field.location}
              </div>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-white font-bold text-xl">{field.name}</h4>
                  <p className="text-[#cbad90] text-sm">{field.type}</p>
                </div>
              </div>
              <div className="flex items-center border-t border-[#493622] pt-4">
                <span className="text-sm text-[#cbad90]">{field.hours}</span>
              </div>
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => navigate(`/dashboard/edit-field/${field.id}`)}
                  className="flex-1 py-2.5 rounded-xl bg-[#493622] text-[#cbad90] hover:text-white hover:bg-[#5d452b] font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    edit
                  </span>
                  Modifier
                </button>
                <button
                  onClick={() => deleteField(field.id)}
                  className="flex-1 py-2.5 rounded-xl bg-[#493622] text-[#cbad90] hover:text-white hover:bg-red-900/50 hover:text-red-400 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    delete
                  </span>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State / Add New Placeholder */}
        <button
          onClick={() => navigate("/dashboard/create-field")}
          className="group relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-[#493622] bg-[#2c241b]/30 p-8 hover:bg-[#2c241b] hover:border-[#f27f0d] transition-all h-full min-h-[400px]"
        >
          <div className="flex items-center justify-center size-16 rounded-full bg-[#493622] text-[#cbad90] group-hover:bg-[#f27f0d] group-hover:text-[#231a10] transition-colors">
            <span className="material-symbols-outlined text-3xl">
              add_home_work
            </span>
          </div>
          <div className="text-center">
            <h4 className="text-lg font-bold text-white">
              Ajouter un nouveau terrain
            </h4>
            <p className="text-sm text-[#cbad90]">
              Configurez les détails, tarifs et disponibilités
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default MyFields;
